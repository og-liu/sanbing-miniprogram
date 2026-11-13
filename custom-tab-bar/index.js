const TABS = [
  {
    pagePath: 'pages/overview/overview',
    label: '总览',
    en: 'OVERVIEW'
  },
  {
    pagePath: 'pages/visit/visit',
    label: '拜访',
    en: 'VISIT'
  },
  {
    pagePath: 'pages/alliance/alliance',
    label: '同盟',
    en: 'ALLIANCE'
  },
  {
    pagePath: 'pages/profile/profile',
    label: '我的',
    en: 'PROFILE'
  }
]

Component({
  data: {
    selected: 0,
    list: TABS
  },

  lifetimes: {
    attached() {
      this.syncByRoute()
    }
  },

  pageLifetimes: {
    show() {
      this.syncByRoute()
    }
  },

  methods: {
    syncByRoute() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const route = current && current.route
      const selected = TABS.findIndex((item) => item.pagePath === route)
      if (selected !== -1 && selected !== this.data.selected) {
        this.setData({ selected })
      }
    },

    onSwitch(event) {
      const index = Number(event.currentTarget.dataset.index)
      const tab = TABS[index]
      if (!tab) return

      this.setData({ selected: index })
      wx.switchTab({
        url: `/${tab.pagePath}`
      })
    }
  }
})
