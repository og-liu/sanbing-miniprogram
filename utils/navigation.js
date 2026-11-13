const TAB_ROUTES = [
  '/pages/overview/overview',
  '/pages/visit/visit',
  '/pages/alliance/alliance',
  '/pages/profile/profile'
]

function isTabRoute(route) {
  return TAB_ROUTES.indexOf(route) !== -1
}

function openRoute(route, options) {
  const config = Object.assign({ url: route }, options || {})
  return isTabRoute(route) ? wx.switchTab(config) : wx.reLaunch(config)
}

function hideHomeButton() {
  if (typeof wx.hideHomeButton !== 'function') return
  wx.hideHomeButton({
    fail() {
      // 旧基础库或页面尚未完成初始化时，保留原生兜底。
    }
  })
}

function syncTabBar(page, selected) {
  if (!page || typeof page.getTabBar !== 'function') return
  const tabBar = page.getTabBar()
  if (tabBar && typeof tabBar.setData === 'function') {
    tabBar.setData({ selected })
  }
}

module.exports = {
  TAB_ROUTES,
  isTabRoute,
  openRoute,
  hideHomeButton,
  syncTabBar
}
