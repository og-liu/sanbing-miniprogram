const ENTER_DURATION = 280

/**
 * Tab 页没有可定制的原生转场；在每次 onShow 时给页面根节点一个短暂的
 * 淡入 + 轻微上升，让 switchTab 的硬切看起来更连续。
 */
function playTabEnter(page) {
  if (!page || typeof page.setData !== 'function') return

  if (page._tabEnterTimer) {
    clearTimeout(page._tabEnterTimer)
  }

  page.setData({ tabEntering: true })
  page._tabEnterTimer = setTimeout(() => {
    page._tabEnterTimer = null
    if (!page.data) return
    page.setData({ tabEntering: false })
  }, ENTER_DURATION)
}

module.exports = {
  ENTER_DURATION,
  playTabEnter
}
