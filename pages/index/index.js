// 登录入口：每次进入都通过云函数上下文重新识别微信身份，不依赖本地用户资料。
const auth = require('../../services/auth')
const onboarding = require('../../services/onboarding')
const navigation = require('../../utils/navigation')

Page({
  data: {
    status: 'loading',
    errorMessage: '',
    loadingKicker: 'VERIFYING IDENTITY',
    loadingTitle: '正在识别微信身份'
  },

  onLoad() {
    this._destroyed = false

    if (auth.isSignedOut()) {
      this.setData({ status: 'signedOut' })
      return
    }

    if (!onboarding.hasEnteredApp()) {
      this.setData({ status: 'welcome' })
      return
    }

    this.startLogin()
  },

  onEnter() {
    if (this.data.status !== 'signedOut' && this.data.status !== 'welcome') {
      return
    }
    auth.clearSignedOut()
    this.startLogin()
  },

  onUnload() {
    this._destroyed = true
  },

  onRetry() {
    if (this.data.status === 'loading') return
    this.startLogin()
  },

  onBrowse() {
    wx.switchTab({ url: '/pages/overview/overview' })
  },

  startLogin() {
    if (this._loggingIn) return
    this._loggingIn = true
    const hasEntered = onboarding.hasEnteredApp()
    this.setData({
      status: 'loading',
      errorMessage: '',
      loadingKicker: hasEntered ? 'RESTORING IDENTITY' : 'VERIFYING IDENTITY',
      loadingTitle: hasEntered ? '正在恢复你的档案' : '正在识别微信身份'
    })

    auth
      .bootstrap()
      .then((result) => {
        if (this._destroyed) return
        const target = onboarding.getLoginRoute(result)
        const app = getApp()

        onboarding.markEnteredApp()

        if (
          target === '/pages/profile/profile' &&
          app &&
          app.globalData
        ) {
          app.globalData.pendingBootstrap = result
        }

        navigation.openRoute(target, {
          fail: () => {
            if (this._destroyed) return
            this.setData({
              status: 'error',
              errorMessage: '页面跳转失败，请重新尝试'
            })
          }
        })
      })
      .catch((error) => {
        if (this._destroyed) return
        this.setData({
          status: 'error',
          errorMessage:
            (error && error.message) || '微信登录失败，请稍后重试'
        })
      })
      .finally(() => {
        this._loggingIn = false
      })
  }
})
