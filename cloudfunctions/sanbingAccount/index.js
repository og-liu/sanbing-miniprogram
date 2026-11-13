'use strict'

const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const { AppError } = require('./lib/errors')
const { decodeAvatarBase64 } = require('./lib/avatar')
const {
  MAX_AVATAR_BYTES,
  CORE_ATTRIBUTE_KEYS,
  emptyCoreAttributes,
  validateGameProfileInput,
  validateGameProfileUpdateInput,
  validateWechatProfileInput
} = require('./lib/validation')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const USERS_COLLECTION = 'sanbing_users'
const GAME_PROFILES_COLLECTION = 'sanbing_game_profiles'
const AVATAR_FOLDER = 'avatars'

function nowIso() {
  return new Date().toISOString()
}

function identityKey(openid) {
  return crypto
    .createHash('sha256')
    .update(`sanbing:user:${openid}`)
    .digest('hex')
}

function createPublicId() {
  return crypto.randomBytes(16).toString('hex')
}

async function getDocumentByUserId(collectionName, userId) {
  const result = await db
    .collection(collectionName)
    .where({ _id: userId })
    .limit(1)
    .get()
  return result.data && result.data[0] ? result.data[0] : null
}

function isClientWrittenDocument(document) {
  return Boolean(document && document._openid)
}

function coreAttributesFromProfile(profile) {
  const source = (profile && profile.attributes) || {}
  const attributes = emptyCoreAttributes()
  CORE_ATTRIBUTE_KEYS.forEach((key) => {
    if (typeof source[key] === 'number' && Number.isFinite(source[key])) {
      attributes[key] = source[key]
    }
  })
  return attributes
}

async function ensureUser(context) {
  const openid = context.OPENID
  const userId = identityKey(openid)
  const existing = await getDocumentByUserId(USERS_COLLECTION, userId)
  if (existing && isClientWrittenDocument(existing)) {
    // Cloud SDK 客户端直写会自动带 _openid，云函数管理端写入不会。
    // 如果发现客户端伪造了同 ID 文档，先删除并用服务端数据重建。
    console.warn('[sanbingAccount] 检测到客户端伪造账号文档，已覆盖')
    await db.collection(USERS_COLLECTION).doc(userId).remove()
  } else if (existing) {
    return existing
  }

  const now = nowIso()
  const userData = {
    openid,
    unionid: context.UNIONID || null,
    publicId: createPublicId(),
    wechatNickname: null,
    avatarFileId: null,
    avatarUpdatedAt: null,
    profileInitialized: false,
    createdAt: now,
    updatedAt: now
  }

  try {
    await db.collection(USERS_COLLECTION).doc(userId).set({
      data: userData
    })
  } catch (error) {
    // 极小概率的并发首次登录：如果另一个请求已创建账号，直接复用。
    const concurrentUser = await getDocumentByUserId(USERS_COLLECTION, userId)
    if (concurrentUser && !isClientWrittenDocument(concurrentUser)) {
      return concurrentUser
    }
    throw error
  }

  return {
    _id: userId,
    ...userData
  }
}

async function getAvatarTempUrl(user) {
  if (!user.avatarFileId) return null

  try {
    const result = await cloud.getTempFileURL({
      fileList: [user.avatarFileId]
    })
    const item = result.fileList && result.fileList[0]
    return item && item.tempFileURL ? item.tempFileURL : null
  } catch (error) {
    console.warn('[sanbingAccount] 获取头像临时链接失败', {
      userId: user.publicId,
      errorName: error && error.name,
      errorMessage: error && error.message
    })
    return null
  }
}

async function buildBundle(user) {
  const storedProfile = await getDocumentByUserId(
    GAME_PROFILES_COLLECTION,
    user._id
  )
  const profile =
    storedProfile && !isClientWrittenDocument(storedProfile)
      ? storedProfile
      : null
  const initialized = Boolean(profile && profile.isInitialized === true)
  const avatarUrl = await getAvatarTempUrl(user)
  const hasAvatar = Boolean(user.avatarFileId)
  const hasNickname = Boolean(user.wechatNickname)
  const organization = (profile && profile.organization) || {}

  return {
    user: {
      id: user.publicId,
      wechat: {
        nickname: user.wechatNickname || null,
        avatarUrl,
        hasAvatar,
        isComplete: hasNickname && hasAvatar
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    },
    gameProfile: initialized
      ? {
          gameNickname: profile.gameNickname,
          totalPower: profile.totalPower,
          gender: profile.gender,
          organization: {
            server: organization.server || 'unjoined',
            guild: organization.guild || 'unjoined',
            guildRank: organization.guildRank || 'none'
          },
          attributes: coreAttributesFromProfile(profile),
          isInitialized: true,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        }
      : null,
    initialized
  }
}

async function handleBootstrap(context) {
  const user = await ensureUser(context)
  return buildBundle(user)
}

async function handleSaveGameProfile(context, event) {
  const input = validateGameProfileInput(event)
  const userId = identityKey(context.OPENID)
  await ensureUser(context)

  const now = nowIso()
  const profileData = {
    gameNickname: input.gameNickname,
    totalPower: input.totalPower,
    gender: input.gender,
    organization: {
      server: 'unjoined',
      guild: 'unjoined',
      guildRank: 'none'
    },
    attributes: emptyCoreAttributes(),
    isInitialized: true,
    createdAt: now,
    updatedAt: now
  }

  await db.runTransaction(async (transaction) => {
    const userResult = await transaction
      .collection(USERS_COLLECTION)
      .doc(userId)
      .get()
    const currentUser = userResult && userResult.data

    if (!currentUser) {
      throw new AppError('UNAUTHORIZED', '未找到当前平台账号，请重新进入小程序')
    }
    if (currentUser.profileInitialized === true) {
      throw new AppError(
        'PROFILE_ALREADY_INITIALIZED',
        '个人角色资料已经初始化，无需重复提交'
      )
    }

    await transaction
      .collection(GAME_PROFILES_COLLECTION)
      .doc(userId)
      .set({ data: profileData })
    await transaction
      .collection(USERS_COLLECTION)
      .doc(userId)
      .update({
        data: {
          profileInitialized: true,
          updatedAt: now
        }
      })
  })

  const user = await getDocumentByUserId(USERS_COLLECTION, userId)
  return buildBundle(user)
}

async function handleUpdateGameProfile(context, event) {
  const input = validateGameProfileUpdateInput(event)
  const userId = identityKey(context.OPENID)
  const user = await getDocumentByUserId(USERS_COLLECTION, userId)
  if (!user) {
    throw new AppError('UNAUTHORIZED', '未找到当前平台账号，请重新进入小程序')
  }

  const profile = await getDocumentByUserId(GAME_PROFILES_COLLECTION, userId)
  if (!profile || profile.isInitialized !== true) {
    throw new AppError(
      'PROFILE_NOT_INITIALIZED',
      '角色档案尚未初始化，请先完成初始化'
    )
  }

  await db.collection(GAME_PROFILES_COLLECTION).doc(userId).update({
    data: {
      gameNickname: input.gameNickname,
      totalPower: input.totalPower,
      gender: input.gender,
      attributes: input.attributes,
      updatedAt: nowIso()
    }
  })

  return buildBundle(user)
}

async function handleSaveWechatProfile(context, event) {
  const input = validateWechatProfileInput(event, MAX_AVATAR_BYTES)
  const userId = identityKey(context.OPENID)
  const currentUser = await ensureUser(context)
  const now = nowIso()

  let uploadedFileId = null
  if (input.avatarBase64) {
    const avatar = decodeAvatarBase64(input.avatarBase64, MAX_AVATAR_BYTES)
    const cloudPath = `${AVATAR_FOLDER}/${currentUser.publicId}/${Date.now()}-${crypto
      .randomBytes(8)
      .toString('hex')}.${avatar.ext}`
    const uploadResult = await cloud.uploadFile({
      cloudPath,
      fileContent: avatar.buffer
    })
    uploadedFileId = uploadResult.fileID
  }

  const updateData = {
    wechatNickname: input.nickname,
    updatedAt: now
  }
  if (uploadedFileId) {
    updateData.avatarFileId = uploadedFileId
    updateData.avatarUpdatedAt = now
  }

  try {
    await db.collection(USERS_COLLECTION).doc(userId).update({
      data: updateData
    })
  } catch (error) {
    if (uploadedFileId) {
      try {
        await cloud.deleteFile({ fileList: [uploadedFileId] })
      } catch (cleanupError) {
        console.warn('[sanbingAccount] 清理上传失败的头像时出错', {
          errorName: cleanupError && cleanupError.name
        })
      }
    }
    throw error
  }

  if (uploadedFileId && currentUser.avatarFileId) {
    try {
      await cloud.deleteFile({
        fileList: [currentUser.avatarFileId]
      })
    } catch (error) {
      console.warn('[sanbingAccount] 清理旧头像失败', {
        userId: currentUser.publicId,
        errorName: error && error.name
      })
    }
  }

  const user = await getDocumentByUserId(USERS_COLLECTION, userId)
  return buildBundle(user)
}

async function handleResetProfile(context) {
  const userId = identityKey(context.OPENID)
  const user = await getDocumentByUserId(USERS_COLLECTION, userId)
  const profile = await getDocumentByUserId(GAME_PROFILES_COLLECTION, userId)
  const avatarFileId = user ? user.avatarFileId : null

  if (profile) {
    await db.collection(GAME_PROFILES_COLLECTION).doc(userId).remove()
  }
  if (user) {
    await db.collection(USERS_COLLECTION).doc(userId).remove()
  }

  if (avatarFileId) {
    try {
      await cloud.deleteFile({ fileList: [avatarFileId] })
    } catch (error) {
      // 数据库档案已经清空；头像清理失败不阻塞重置，只记录以便排查。
      console.warn('[sanbingAccount] 清理重置档案的头像失败', {
        userId: user && user.publicId,
        errorName: error && error.name,
        errorMessage: error && error.message
      })
    }
  }

  return { reset: true }
}

function success(data) {
  return { ok: true, data }
}

function failure(code, message) {
  return {
    ok: false,
    error: {
      code,
      message
    }
  }
}

exports.main = async (event) => {
  const context = cloud.getWXContext()
  if (!context.OPENID) {
    return failure('UNAUTHORIZED', '无法识别当前微信用户，请重新进入小程序')
  }

  const action = event && event.action

  try {
    if (action === 'bootstrap') {
      return success(await handleBootstrap(context))
    }
    if (action === 'saveGameProfile') {
      return success(await handleSaveGameProfile(context, event))
    }
    if (action === 'updateGameProfile') {
      return success(await handleUpdateGameProfile(context, event))
    }
    if (action === 'saveWechatProfile') {
      return success(await handleSaveWechatProfile(context, event))
    }
    if (action === 'resetProfile') {
      return success(await handleResetProfile(context))
    }
    throw new AppError('INVALID_ACTION', '不支持的操作')
  } catch (error) {
    if (error && error.isOperational) {
      return failure(error.code, error.message)
    }

    console.error('[sanbingAccount] 执行失败', {
      action,
      errorName: error && error.name,
      errorMessage: error && error.message
    })
    return failure('INTERNAL_ERROR', '云端服务暂时不可用，请稍后重试')
  }
}
