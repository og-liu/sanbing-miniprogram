Component({
  properties: {
    title: {
      type: String,
      value: ''
    }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    totalHeight: 64
  },

  lifetimes: {
    attached() {
      this.measure()
    }
  },

  methods: {
    measure() {
      let statusBarHeight = 20
      let navBarHeight = 44

      try {
        const system = wx.getSystemInfoSync()
        statusBarHeight = system.statusBarHeight || statusBarHeight
      } catch (error) {
        // 使用默认状态栏高度，保证旧基础库仍能渲染。
      }

      try {
        const capsule = wx.getMenuButtonBoundingClientRect()
        if (capsule && capsule.height) {
          const gap = Math.max(capsule.top - statusBarHeight, 0)
          navBarHeight = capsule.height + gap * 2
        }
      } catch (error) {
        // 胶囊信息不可用时使用 44px 兜底。
      }

      this.setData({
        statusBarHeight,
        navBarHeight,
        totalHeight: statusBarHeight + navBarHeight
      })
    }
  }
})
