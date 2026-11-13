const navigation = require('../../utils/navigation')
const tabMotion = require('../../utils/tab-motion')

Page({
  data: {
    tabEntering: false
  },

  onShow() {
    navigation.syncTabBar(this, 0)
    tabMotion.playTabEnter(this)
  }
})
