const auth = require('../../services/auth')
const api = require('../../services/api')
const display = require('../../utils/display')
const navigation = require('../../utils/navigation')
const onboarding = require('../../services/onboarding')
const tabMotion = require('../../utils/tab-motion')

Page({
  data: {
    tabEntering: false,
    loading: true,
    loadError: '',
    initialized: false,

    wechatNickname: '',
    hasWechatNickname: false,
    hasWechatAvatar: false,
    avatarSrc: '',
    avatarError: false,
    wechatProfileComplete: false,

    gameNickname: '',
    gender: '',
    genderLabel: '',
    totalPowerDisplay: '',
    refreshing: false,
    organizationServerText: '暂未加入任何区服',
    organizationGuildText: '暂未加入任何同盟',
    coreAttributes: {},
    coreAttributeItems: []
  },

  onLoad() {
    this._alive = true
    this._authPromptShown = false
    this._powerTimer = null
    this._lastPowerValue = null

    const app = getApp()
    const pending =
      app && app.globalData ? app.globalData.pendingBootstrap : null

    if (pending) {
      app.globalData.pendingBootstrap = null
      onboarding.markEnteredApp()
      this.applyBundle(pending)
      return
    }

    if (auth.isSignedOut() || !onboarding.hasEnteredApp()) {
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }

    this.loadProfile()
  },

  onShow() {
    navigation.syncTabBar(this, 3)
    tabMotion.playTabEnter(this)

    const app = getApp()
    if (app && app.globalData && app.globalData.profileDirty) {
      app.globalData.profileDirty = false
      this.loadProfile({ fromRefresh: true })
    }
  },

  onUnload() {
    this._alive = false
    this.stopPowerAnimation()
  },

  openSettings() {
    if (this.data.loading || this.data.loadError) return
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  openGameProfileEditor(event) {
    if (this.data.loading || this.data.loadError) return
    const section =
      event && event.currentTarget.dataset.section === 'core'
        ? 'core'
        : 'basic'
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.gameProfileEditor = {
        gameNickname: this.data.gameNickname,
        gender: this.data.gender,
        totalPower: this.data.totalPower,
        attributes: this.data.coreAttributes
      }
    }
    wx.navigateTo({
      url: `/pages/game-profile-edit/game-profile-edit?section=${section}`
    })
  },

  openWechatProfilePage() {
    if (this.data.loading || this.data.loadError) return
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.profileDirty = true
    }
    wx.navigateTo({
      url: '/pages/wechat-profile/wechat-profile?mode=edit'
    })
  },

  onRefresh() {
    if (this._refreshing) return
    this._refreshing = true
    this.setData({ refreshing: true })
    this.loadProfile({ fromRefresh: true }).finally(() => {
      this._refreshing = false
      if (this._alive) this.setData({ refreshing: false })
    })
  },

  onRetryProfile() {
    this.loadProfile()
  },

  async loadProfile(options = {}) {
    if (!this._alive) return
    if (this._profileRequest) return

    if (!options.fromRefresh) {
      this.setData({
        loading: true,
        loadError: ''
      })
    }

    this._profileRequest = auth.bootstrap()
    try {
      const me = await this._profileRequest
      if (!this._alive) return

      if (!me || !me.initialized || !me.gameProfile) {
        wx.reLaunch({ url: '/pages/init/init' })
        return
      }

      this.applyBundle(me)
    } catch (error) {
      if (!this._alive) return
      if (api.isAuthError(error)) {
        this.handleUnauthorized()
        return
      }

      if (this.data.loading || !this.data.initialized) {
        this.setData({
          loading: false,
          loadError:
            (error && error.message) || '个人资料加载失败，请稍后重试'
        })
      } else {
        wx.showToast({
          title: (error && error.message) || '资料刷新失败',
          icon: 'none'
        })
      }
    } finally {
      this._profileRequest = null
    }
  },

  applyBundle(bundle) {
    this.stopPowerAnimation()
    const view = display.buildProfileView(bundle)
    const target =
      typeof view.totalPower === 'number' ? Math.trunc(view.totalPower) : null
    const base = {
      ...view,
      loading: false,
      loadError: '',
      avatarError: Boolean(view.hasWechatAvatar) && !view.avatarSrc
    }
    const shouldAnimate =
      target !== null &&
      target > 0 &&
      this._lastPowerValue !== target &&
      this.shouldAnimatePower()

    this._lastPowerValue = target

    if (shouldAnimate) {
      this.setData({ ...base, totalPowerDisplay: '0' }, () => {
        this.animatePower(target)
      })
      return
    }

    this.setData({ ...base, totalPowerDisplay: view.totalPowerDisplay })
  },

  shouldAnimatePower() {
    try {
      if (typeof wx.getSystemSetting !== 'function') return true
      const setting = wx.getSystemSetting() || {}
      return !(setting.reduceMotion || setting.reduceMotionEnabled)
    } catch (error) {
      return true
    }
  },

  stopPowerAnimation() {
    if (!this._powerTimer) return
    clearTimeout(this._powerTimer)
    this._powerTimer = null
  },

  animatePower(target) {
    if (!this._alive) return
    this.stopPowerAnimation()

    const startedAt = Date.now()
    const duration = 900
    const easeOut = (progress) => 1 - Math.pow(2, -10 * progress)
    const tick = () => {
      if (!this._alive) return
      const progress = Math.min((Date.now() - startedAt) / duration, 1)
      const eased = progress >= 1 ? 1 : easeOut(progress)
      this.setData({
        totalPowerDisplay: display.formatPower(
          Math.round(target * eased)
        )
      })
      if (progress < 1) {
        this._powerTimer = setTimeout(tick, 32)
      } else {
        this._powerTimer = null
      }
    }

    this._powerTimer = setTimeout(tick, 120)
  },

  onAvatarError() {
    if (!this._alive) return
    this.setData({
      avatarSrc: '',
      avatarError: this.data.hasWechatAvatar
    })
  },





  handleUnauthorized() {
    if (!this._alive) return
    onboarding.clearEnteredApp()
    auth.clearSignedOut()
    wx.reLaunch({ url: '/pages/index/index' })
  }
})