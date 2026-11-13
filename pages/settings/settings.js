const auth = require('../../services/auth')
const onboarding = require('../../services/onboarding')

Page({
  onResetProfile() {
    if (this._resetting) return

    wx.showModal({
      title: '注销账户',
      content:
        '注销后将清空微信资料、角色资料、头像和云端档案，并回到首次进入状态。此操作不可恢复。',
      confirmText: '确认注销',
      cancelText: '取消',
      success: (result) => {
        if (!result.confirm || this._resetting) return
        this._resetting = true
        wx.showLoading({ title: '正在清空档案', mask: true })

        auth
          .resetProfile()
          .then(() => {
            onboarding.clearEnteredApp()
            onboarding.clearWechatProfileSkipped()
            auth.clearSignedOut()

            const app = getApp()
            if (app && app.globalData) {
              app.globalData.pendingBootstrap = null
              app.globalData.profileDirty = false
            }

            wx.hideLoading()
            wx.reLaunch({ url: '/pages/overview/overview' })
          })
          .catch((error) => {
            this._resetting = false
            wx.hideLoading()
            wx.showModal({
              title: '注销失败',
              content:
                (error && error.message) || '云端档案暂未清空，请稍后重试',
              showCancel: false
            })
          })
      }
    })
  },

  onEditWechatProfile() {
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.profileDirty = true
    }
    wx.navigateTo({
      url: '/pages/wechat-profile/wechat-profile?mode=edit'
    })
  },

  onSignOut() {
    wx.showModal({
      title: '退出登录',
      content: '退出后回到未登录状态。微信身份不会被解除，仍可继续浏览公开内容。',
      confirmText: '退出',
      cancelText: '取消',
      success: (result) => {
        if (result.confirm) auth.signOut()
      }
    })
  }
})
