const { AppError } = require('./errors')

const CORE_ATTRIBUTES = [
  { key: 'infantryHp', label: '步兵生命', type: 'percent' },
  { key: 'infantryDefense', label: '步兵防御', type: 'percent' },
  { key: 'archerAttack', label: '弓兵攻击', type: 'percent' },
  { key: 'archerDestruction', label: '弓兵破坏', type: 'percent' },
  { key: 'cavalryAttack', label: '骑兵攻击', type: 'percent' },
  { key: 'cavalryDestruction', label: '骑兵破坏', type: 'percent' },
  { key: 'rallyDamageBonus', label: '集结伤害加成', type: 'percent' },
  { key: 'rallyDamageReduction', label: '集结伤害减免', type: 'percent' },
  { key: 'marchCapacity', label: '出征兵力上限', type: 'integer' }
]

const CORE_ATTRIBUTE_KEYS = CORE_ATTRIBUTES.map((item) => item.key)

const MAX_GAME_NICKNAME_LENGTH = 30
const MAX_WECHAT_NICKNAME_LENGTH = 30
const MAX_TOTAL_POWER = 999999999999
const MAX_CORE_PERCENT = 999999.99
const MAX_MARCH_CAPACITY = 999999999
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

function objectBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('INVALID_BODY', '请求内容格式不正确')
  }
  return value
}

function nicknameByCodePoints(value) {
  return Array.from(value).length
}

function normalizeNickname(value, label, maxLength) {
  if (typeof value !== 'string') {
    throw new AppError('INVALID_NICKNAME', `${label}不能为空`)
  }
  const nickname = value.trim().normalize('NFC')
  if (!nickname) {
    throw new AppError('INVALID_NICKNAME', `${label}不能为空`)
  }
  if (CONTROL_CHARACTERS.test(nickname)) {
    throw new AppError('INVALID_NICKNAME', `${label}包含非法字符`)
  }
  if (nicknameByCodePoints(nickname) > maxLength) {
    throw new AppError(
      'INVALID_NICKNAME',
      `${label}不能超过 ${maxLength} 个字符`
    )
  }
  return nickname
}

function emptyCoreAttributes() {
  const attributes = {}
  CORE_ATTRIBUTE_KEYS.forEach((key) => {
    attributes[key] = null
  })
  return attributes
}

function normalizeCoreAttributes(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('INVALID_CORE_ATTRIBUTE', '核心属性格式不正确')
  }

  const attributes = {}
  CORE_ATTRIBUTES.forEach((field) => {
    const rawValue = input[field.key]
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      attributes[field.key] = null
      return
    }

    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      throw new AppError(
        'INVALID_CORE_ATTRIBUTE',
        `${field.label}必须是有效数字`
      )
    }

    if (field.type === 'integer') {
      if (
        !Number.isSafeInteger(rawValue) ||
        rawValue < 0 ||
        rawValue > MAX_MARCH_CAPACITY
      ) {
        throw new AppError(
          'INVALID_CORE_ATTRIBUTE',
          `${field.label}必须是非负整数`
        )
      }
    } else if (
      rawValue < 0 ||
      rawValue > MAX_CORE_PERCENT ||
      Math.abs(rawValue * 100 - Math.round(rawValue * 100)) > 0.000001
    ) {
      throw new AppError(
        'INVALID_CORE_ATTRIBUTE',
        `${field.label}必须是最多两位小数的百分比`
      )
    }

    attributes[field.key] = rawValue
  })

  return attributes
}

function validateGameProfileInput(event) {
  const input = objectBody(event)

  const gameNickname = normalizeNickname(
    input.gameNickname,
    '游戏昵称',
    MAX_GAME_NICKNAME_LENGTH
  )

  const totalPower = input.totalPower
  if (
    typeof totalPower !== 'number' ||
    !Number.isSafeInteger(totalPower) ||
    totalPower < 0 ||
    totalPower > MAX_TOTAL_POWER
  ) {
    throw new AppError(
      'INVALID_TOTAL_POWER',
      '当前总战力必须是有效的非负整数'
    )
  }

  if (!['male', 'female', 'secret'].includes(input.gender)) {
    throw new AppError('INVALID_GENDER', '请选择性别')
  }

  return {
    gameNickname,
    totalPower,
    gender: input.gender
  }
}

function validateGameProfileUpdateInput(event) {
  const base = validateGameProfileInput(event)
  if (!Object.prototype.hasOwnProperty.call(event, 'attributes')) {
    throw new AppError('INVALID_CORE_ATTRIBUTE', '缺少核心属性')
  }
  return {
    ...base,
    attributes: normalizeCoreAttributes(event.attributes)
  }
}

function validateWechatProfileInput(event, maxAvatarBytes) {
  const input = objectBody(event)
  const nickname = normalizeNickname(
    input.nickname,
    '微信昵称',
    MAX_WECHAT_NICKNAME_LENGTH
  )

  let avatarBase64 = null
  if (input.avatarBase64 !== undefined && input.avatarBase64 !== null) {
    if (typeof input.avatarBase64 !== 'string' || !input.avatarBase64) {
      throw new AppError('INVALID_AVATAR', '头像文件格式不正确')
    }
    if (
      input.avatarBase64.length >
      Math.ceil((maxAvatarBytes * 4) / 3) + 8
    ) {
      throw new AppError(
        'AVATAR_TOO_LARGE',
        `头像文件不能超过 ${Math.round(maxAvatarBytes / 1024)}KB`
      )
    }
    if (
      input.avatarBase64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(input.avatarBase64)
    ) {
      throw new AppError('INVALID_AVATAR', '头像文件格式不正确')
    }
    avatarBase64 = input.avatarBase64
  }

  return { nickname, avatarBase64 }
}

module.exports = {
  MAX_AVATAR_BYTES: 500 * 1024,
  MAX_GAME_NICKNAME_LENGTH,
  MAX_WECHAT_NICKNAME_LENGTH,
  MAX_TOTAL_POWER,
  MAX_CORE_PERCENT,
  MAX_MARCH_CAPACITY,
  CORE_ATTRIBUTES,
  CORE_ATTRIBUTE_KEYS,
  emptyCoreAttributes,
  validateGameProfileInput,
  validateGameProfileUpdateInput,
  validateWechatProfileInput
}
