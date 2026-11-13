const config = require('./config/index')

App({
  onLaunch() {
    this.applyWindowBackground()
    if (!wx.cloud) {
      console.error('当前基础库不支持微信云开发，请升级微信客户端或基础库')
      return
    }

    wx.cloud.init({
      env: config.cloudEnvId,
      traceUser: true
    })
  },

  onShow() {
    this.applyWindowBackground()
  },

  applyWindowBackground() {
    if (typeof wx.setBackgroundColor !== 'function') return
    wx.setBackgroundColor({
      backgroundColor: '#f3f1ea',
      backgroundColorTop: '#f3f1ea',
      backgroundColorBottom: '#f3f1ea'
    })
  },

  globalData: {
    appName: '三冰AI助手'
  }
})
