const auth = require('../../services/auth')
const onboarding = require('../../services/onboarding')
const validators = require('../../utils/validators')
const avatarUtils = require('../../utils/avatar')
const navigation = require('../../utils/navigation')

Page({
  data: {
    loading: true,
    loadError: '',
    initialized: false,
    editMode: false,

    nickname: '',
    nicknameError: '',
    avatarPreview: '',
    avatarError: false,
    hasExistingAvatar: false,
    pendingAvatarPath: '',

    formError: '',
    saving: false,
    skipLabel: '暂不设置，先去初始化角色'
  },

  onLoad(options) {
    this._alive = true
    this._editMode = Boolean(options && options.mode === 'edit')
    this.setData({ editMode: this._editMode })
    if (this._editMode) {
      wx.setNavigationBarTitle({ title: '编辑微信资料' })
    }
    this.loadPage()
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

  loadPage() {
    if (!this._alive) return
    this.setData({
      loading: true,
      loadError: ''
    })

    auth
      .bootstrap()
      .then((bundle) => {
        if (!this._alive) return

        if (
          !this._editMode &&
          (onboarding.isWechatProfileComplete(bundle) ||
            onboarding.isWechatProfileSkipped())
        ) {
          this.goNext(bundle)
          return
        }

        const wechat =
          (bundle && bundle.user && bundle.user.wechat) || {}
        this.setData({
          loading: false,
          initialized: Boolean(bundle && bundle.initialized),
          nickname: wechat.nickname || '',
          avatarPreview: wechat.avatarUrl || '',
          hasExistingAvatar: Boolean(wechat.hasAvatar),
          skipLabel: bundle.initialized
            ? '稍后完善，进入个人中心'
            : '暂不设置，先去初始化角色'
        })
      })
      .catch((error) => {
        if (!this._alive) return
        this.setData({
          loading: false,
          loadError:
            (error && error.message) || '微信资料加载失败，请稍后重试'
        })
      })
  },

  onChooseAvatar(event) {
    const avatarUrl =
      event && event.detail && typeof event.detail.avatarUrl === 'string'
        ? event.detail.avatarUrl
        : ''
    if (!avatarUrl) {
      this.setData({ formError: '未能读取所选头像，请重新选择' })
      return
    }

    this.setData({
      avatarPreview: avatarUrl,
      avatarError: false,
      pendingAvatarPath: avatarUrl,
      formError: ''
    })
  },

  onAvatarError() {
    if (!this._alive) return
    this.setData({
      avatarPreview: '',
      avatarError: this.data.hasExistingAvatar
    })
  },

  onNicknameInput(event) {
    this.setData({
      nickname: event.detail.value,
      nicknameError: '',
      formError: ''
    })
  },

  async onSave() {
    if (this.data.saving) return

    const nickname = validators.validateWechatNickname(this.data.nickname)
    if (!nickname.ok) {
      this.setData({ nicknameError: nickname.message })
      return
    }

    if (!this.data.hasExistingAvatar && !this.data.pendingAvatarPath) {
      this.setData({ formError: '请选择微信头像后再继续' })
      return
    }

    this.setData({
      saving: true,
      nicknameError: '',
      formError: ''
    })

    try {
      const payload = { nickname: nickname.value }
      if (this.data.pendingAvatarPath) {
        payload.avatarBase64 = await avatarUtils.prepareAvatarBase64(
          this.data.pendingAvatarPath
        )
      }

      const result = await auth.saveWechatProfile(payload)
      if (!this._alive) return
      if (!result || !result.user) {
        throw new Error('微信资料保存结果异常，请重试')
      }

      onboarding.clearWechatProfileSkipped()
      wx.showToast({
        title: '微信资料已保存',
        icon: 'success',
        duration: 700
      })
      this._redirectTimer = setTimeout(() => {
        if (!this._alive) return
        this.goNext(result)
      }, 350)
    } catch (error) {
      if (!this._alive) return
      this.setData({
        saving: false,
        formError: (error && error.message) || '保存失败，请稍后重试'
      })
    }
  },

  onSkip() {
    if (this.data.saving) return
    onboarding.markWechatProfileSkipped()
    this.goNext({ initialized: this.data.initialized })
  },

  goNext(bundle) {
    const target = this._editMode
      ? '/pages/profile/profile'
      : onboarding.getAfterWechatProfileRoute(bundle)
    navigation.openRoute(target)
  },

  onRetry() {
    this.loadPage()
  }
})