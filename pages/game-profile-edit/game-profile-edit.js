const auth = require('../../services/auth')
const display = require('../../utils/display')
const validators = require('../../utils/validators')
const navigation = require('../../utils/navigation')

function emptyAttributeDrafts() {
  const drafts = {}
  display.CORE_ATTRIBUTES.forEach((item) => {
    drafts[item.key] = ''
  })
  return drafts
}

function emptyFieldErrors() {
  return {
    gameNickname: '',
    totalPower: '',
    gender: ''
  }
}

Page({
  data: {
    loading: true,
    loadError: '',
    saving: false,
    editSection: 'basic',
    editTitle: '编辑基础信息',
    editSubtitle: '修改游戏昵称、性别和当前总战力。',
    gameNickname: '',
    totalPower: '',
    gender: '',
    attributeFields: display.CORE_ATTRIBUTES.map((item) => ({
      ...item,
      placeholder: '未填写'
    })),
    attributeDrafts: emptyAttributeDrafts(),
    attributeErrors: {},
    fieldErrors: emptyFieldErrors(),
    formError: ''
  },

  onLoad(options) {
    this._alive = true
    const section = options && options.section === 'core' ? 'core' : 'basic'
    const isCore = section === 'core'
    this.setData({
      editSection: section,
      editTitle: isCore ? '编辑核心属性' : '编辑基础信息',
      editSubtitle: isCore
        ? '填写 8 项百分比属性和出征兵力上限。'
        : '修改游戏昵称、性别和当前总战力。'
    })
    wx.setNavigationBarTitle({
      title: isCore ? '编辑核心属性' : '编辑基础信息'
    })

    const app = getApp()
    const seed =
      app && app.globalData ? app.globalData.gameProfileEditor : null

    if (seed) {
      app.globalData.gameProfileEditor = null
      this.fillFromSeed(seed)
      return
    }

    this.loadProfile()
  },

  onUnload() {
    this._alive = false
  },

  loadProfile() {
    this.setData({ loading: true, loadError: '' })
    auth
      .bootstrap()
      .then((bundle) => {
        if (!this._alive) return
        if (!bundle || !bundle.initialized || !bundle.gameProfile) {
          navigation.openRoute('/pages/profile/profile')
          return
        }
        const view = display.buildProfileView(bundle)
        this.fillFromSeed({
          gameNickname: view.gameNickname,
          gender: view.gender,
          totalPower: view.totalPower,
          attributes: view.coreAttributes
        })
      })
      .catch((error) => {
        if (!this._alive) return
        this.setData({
          loading: false,
          loadError:
            (error && error.message) || '角色资料加载失败，请稍后重试'
        })
      })
  },

  fillFromSeed(seed) {
    const drafts = emptyAttributeDrafts()
    display.CORE_ATTRIBUTES.forEach((item) => {
      const value = seed.attributes ? seed.attributes[item.key] : null
      drafts[item.key] =
        typeof value === 'number' && Number.isFinite(value)
          ? String(value)
          : ''
    })

    this.setData({
      loading: false,
      loadError: '',
      gameNickname: seed.gameNickname || '',
      gender: seed.gender || '',
      totalPower:
        typeof seed.totalPower === 'number' ? String(seed.totalPower) : '',
      attributeDrafts: drafts,
      attributeErrors: {},
      fieldErrors: emptyFieldErrors(),
      formError: ''
    })
  },

  onNicknameInput(event) {
    this.setData({
      gameNickname: event.detail.value,
      'fieldErrors.gameNickname': '',
      formError: ''
    })
  },

  onPowerInput(event) {
    this.setData({
      totalPower: event.detail.value,
      'fieldErrors.totalPower': '',
      formError: ''
    })
  },

  onGenderSelect(event) {
    const gender = event.currentTarget.dataset.gender
    if (!['male', 'female', 'secret'].includes(gender)) return
    this.setData({
      gender,
      'fieldErrors.gender': '',
      formError: ''
    })
  },

  onAttributeInput(event) {
    const key = event.currentTarget.dataset.key
    const value = event.detail.value
    this.setData({
      [`attributeDrafts.${key}`]: value,
      [`attributeErrors.${key}`]: '',
      formError: ''
    })
  },

  onRetry() {
    this.loadProfile()
  },

  onSave() {
    if (this.data.saving) return

    const nickname = validators.validateGameNickname(
      this.data.gameNickname
    )
    const power = validators.validateTotalPower(this.data.totalPower)
    const gender = validators.validateGender(this.data.gender)

    const fieldErrors = {
      gameNickname: nickname.ok ? '' : nickname.message,
      totalPower: power.ok ? '' : power.message,
      gender: gender.ok ? '' : gender.message
    }

    const attributeErrors = {}
    const attributes = {}
    display.CORE_ATTRIBUTES.forEach((item) => {
      const result = validators.validateCoreAttributeValue(
        item.key,
        this.data.attributeDrafts[item.key]
      )
      if (!result.ok) {
        attributeErrors[item.key] = `${item.label}${result.message}`
      } else {
        attributes[item.key] = result.value
      }
    })

    const hasFieldError =
      fieldErrors.gameNickname ||
      fieldErrors.totalPower ||
      fieldErrors.gender
    const hasAttributeError = Object.keys(attributeErrors).length > 0

    if (hasFieldError || hasAttributeError) {
      this.setData({ fieldErrors, attributeErrors, formError: '' })
      return
    }

    this.setData({ saving: true, formError: '', attributeErrors: {} })

    auth
      .updateGameProfile({
        gameNickname: nickname.value,
        totalPower: power.power,
        gender: gender.value,
        attributes
      })
      .then(() => {
        if (!this._alive) return
        const app = getApp()
        if (app && app.globalData) {
          app.globalData.profileDirty = true
        }
        this.setData({ saving: false })
        wx.navigateBack({
          fail: () => navigation.openRoute('/pages/profile/profile')
        })
      })
      .catch((error) => {
        if (!this._alive) return
        this.setData({
          saving: false,
          formError:
            (error && error.message) || '保存失败，请稍后重试'
        })
      })
  }
})
