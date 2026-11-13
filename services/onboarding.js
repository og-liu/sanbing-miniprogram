const WECHAT_SKIP_KEY = 'sanbing.onboarding.wechatSkipped.v1'
const ENTERED_KEY = 'sanbing.entry.completed.v1'

const ROUTES = {
  wechatProfile: '/pages/wechat-profile/wechat-profile',
  init: '/pages/init/init',
  profile: '/pages/profile/profile'
}

function isWechatProfileComplete(bundle) {
  return Boolean(
    bundle &&
      bundle.user &&
      bundle.user.wechat &&
      bundle.user.wechat.isComplete
  )
}

function isInitialized(bundle) {
  return Boolean(bundle && bundle.initialized)
}

function hasEnteredApp() {
  try {
    return wx.getStorageSync(ENTERED_KEY) === true
  } catch (error) {
    return false
  }
}

function markEnteredApp() {
  try {
    wx.setStorageSync(ENTERED_KEY, true)
  } catch (error) {
    // 本地标记失败只影响下次是否自动进入，不影响身份与云端资料。
  }
}

function clearEnteredApp() {
  try {
    wx.removeStorageSync(ENTERED_KEY)
  } catch (error) {
    // 忽略本地偏好写入失败。
  }
}

function isWechatProfileSkipped() {
  try {
    return wx.getStorageSync(WECHAT_SKIP_KEY) === true
  } catch (error) {
    return false
  }
}

function markWechatProfileSkipped() {
  try {
    wx.setStorageSync(WECHAT_SKIP_KEY, true)
  } catch (error) {
    // 本地偏好写入失败只影响下次是否自动提示，不影响账号与资料保存。
  }
}

function clearWechatProfileSkipped() {
  try {
    wx.removeStorageSync(WECHAT_SKIP_KEY)
  } catch (error) {
    // 忽略本地偏好写入失败。
  }
}

/**
 * 登录后只按角色初始化状态分流。
 * 微信头像 / 昵称不是登录前置条件，只能由用户之后主动进入编辑页。
 */
function getLoginRoute(bundle) {
  return getAfterWechatProfileRoute(bundle)
}

/**
 * 微信资料步骤保存/跳过后使用。
 */
function getAfterWechatProfileRoute(bundle) {
  return isInitialized(bundle) ? ROUTES.profile : ROUTES.init
}

module.exports = {
  isWechatProfileComplete,
  hasEnteredApp,
  markEnteredApp,
  clearEnteredApp,
  isWechatProfileSkipped,
  markWechatProfileSkipped,
  clearWechatProfileSkipped,
  getLoginRoute,
  getAfterWechatProfileRoute
}
