const api = require('./api')
const onboarding = require('./onboarding')

const SIGNED_OUT_KEY = 'sanbing.auth.signedOut.v1'

/**
 * 微信云开发会自动携带当前微信身份。
 * 云函数从调用上下文读取 OPENID，不存在自建 Session。
 */
function bootstrap() {
  return api.call('bootstrap')
}

function saveGameProfile(data) {
  return api.call('saveGameProfile', data)
}

function saveWechatProfile(data) {
  return api.call('saveWechatProfile', data)
}

function updateGameProfile(data) {
  return api.call('updateGameProfile', data)
}

function resetProfile() {
  return api.call('resetProfile')
}

function isSignedOut() {
  try {
    return wx.getStorageSync(SIGNED_OUT_KEY) === true
  } catch (error) {
    return false
  }
}

function clearSignedOut() {
  try {
    wx.removeStorageSync(SIGNED_OUT_KEY)
  } catch (error) {
    // 本地偏好写入失败不影响云端身份。
  }
}

function signOut() {
  try {
    wx.setStorageSync(SIGNED_OUT_KEY, true)
  } catch (error) {
    // 即使本地标记失败，也仍然回到入口页。
  }

  onboarding.clearWechatProfileSkipped()

  const app = getApp()
  if (app && app.globalData) {
    app.globalData.pendingBootstrap = null
  }

  wx.reLaunch({ url: '/pages/profile/profile' })
}

function goToLogin() {
  wx.reLaunch({ url: '/pages/profile/profile' })
}

module.exports = {
  bootstrap,
  saveGameProfile,
  saveWechatProfile,
  updateGameProfile,
  resetProfile,
  isSignedOut,
  clearSignedOut,
  signOut,
  goToLogin
}
