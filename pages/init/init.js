const auth = require('../../services/auth')
const api = require('../../services/api')
const validators = require('../../utils/validators')
const navigation = require('../../utils/navigation')

function emptyErrors() {
  return {
    gameNickname: '',
    totalPower: '',
    gender: ''
  }
}

Page({
  data: {
    guardLoading: true,
    guardError: '',
    gameNickname: '',
    totalPower: '',
    gender: '',
    fieldErrors: emptyErrors(),
    formError: '',
    submitting: false
  },

  onLoad() {
    this._alive = true
    this.loadGuard()
  },

  onShow() {
    navigation.hideHomeButton()
  },

  onUnload() {
    this._alive = false
    if (this._redirectTimer) {
      clearTimeout(this._redirectTimer)
    }
  },

  loadGuard() {
    this.setData({
      guardLoading: true,
      guardError: ''
    })

    auth
      .bootstrap()
      .then((me) => {
        if (!this._alive) return
        if (me && me.initialized) {
          navigation.openRoute('/pages/profile/profile')
          return
        }
        this.setData({ guardLoading: false })
      })
      .catch((error) => {
        if (!this._alive) return
        this.setData({
          guardLoading: false,
          guardError: api.isAuthError(error)
            ? '微信身份校验失败，请点击重新加载或重新进入小程序'
            : (error && error.message) ||
              '无法加载当前账号状态，请检查网络后重试'
        })
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

  validateForm() {
    const nickname = validators.validateGameNickname(this.data.gameNickname)
    const power = validators.validateTotalPower(this.data.totalPower)
    const gender = validators.validateGender(this.data.gender)
    const fieldErrors = {
      gameNickname: nickname.ok ? '' : nickname.message,
      totalPower: power.ok ? '' : power.message,
      gender: gender.ok ? '' : gender.message
    }
    const firstError =
      fieldErrors.gameNickname || fieldErrors.totalPower || fieldErrors.gender

    this.setData({ fieldErrors })

    if (firstError) {
      wx.showToast({ title: firstError, icon: 'none' })
      return null
    }

    return {
      gameNickname: nickname.value,
      totalPower: power.power,
      gender: gender.value
    }
  },

  onSubmit() {
    if (this.data.submitting) return

    const payload = this.validateForm()
    if (!payload) return

    this.setData({
      submitting: true,
      formError: ''
    })

    auth
      .saveGameProfile(payload)
      .then((result) => {
        if (!this._alive) return
        if (!result || !result.initialized || !result.gameProfile) {
          throw new Error('初始化状态未保存成功，请重试')
        }

        wx.showToast({
          title: '初始化完成',
          icon: 'success',
          duration: 900
        })
        this._redirectTimer = setTimeout(() => {
          if (!this._alive) return
          navigation.openRoute('/pages/profile/profile')
        }, 500)
      })
      .catch((error) => {
        if (!this._alive) return
        if (api.isAuthError(error)) {
          this.setData({
            formError: '微信身份校验失败，请重新进入小程序后再试'
          })
          return
        }
        if (error && error.code === 'PROFILE_ALREADY_INITIALIZED') {
          wx.showToast({
            title: '角色资料已初始化',
            icon: 'none',
            duration: 1000
          })
          this._redirectTimer = setTimeout(() => {
            if (!this._alive) return
            navigation.openRoute('/pages/profile/profile')
          }, 500)
          return
        }
        this.setData({
          formError:
            (error && error.message) || '资料保存失败，请稍后重试'
        })
      })
      .finally(() => {
        if (!this._alive) return
        this.setData({ submitting: false })
      })
  },
})