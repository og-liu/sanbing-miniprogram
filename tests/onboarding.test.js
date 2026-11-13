const assert = require('assert')
const test = require('node:test')

const storage = {}

global.wx = {
  getStorageSync(key) {
    return storage[key] === undefined ? '' : storage[key]
  },
  setStorageSync(key, value) {
    storage[key] = value
  },
  removeStorageSync(key) {
    delete storage[key]
  }
}

const onboarding = require('../services/onboarding')

test('微信资料不完整时，登录也不强制进入微信资料页', () => {
  onboarding.clearWechatProfileSkipped()
  const bundle = {
    initialized: true,
    user: {
      wechat: {
        isComplete: false
      }
    }
  }

  assert.equal(
    onboarding.getLoginRoute(bundle),
    '/pages/profile/profile'
  )
  assert.equal(
    onboarding.getAfterWechatProfileRoute(bundle),
    '/pages/profile/profile'
  )
})

test('已完善微信资料时按游戏初始化状态进入下一页', () => {
  onboarding.clearWechatProfileSkipped()
  const complete = {
    initialized: true,
    user: {
      wechat: {
        isComplete: true
      }
    }
  }
  const notInitialized = {
    initialized: false,
    user: {
      wechat: {
        isComplete: true
      }
    }
  }

  assert.equal(onboarding.getLoginRoute(complete), '/pages/profile/profile')
  assert.equal(onboarding.getLoginRoute(notInitialized), '/pages/init/init')
})

test('微信资料跳过状态可写入和清除，不影响登录分流', () => {
  const bundle = {
    initialized: false,
    user: {
      wechat: {
        isComplete: false
      }
    }
  }

  onboarding.markWechatProfileSkipped()
  assert.equal(onboarding.isWechatProfileSkipped(), true)
  assert.equal(onboarding.getLoginRoute(bundle), '/pages/init/init')

  onboarding.clearWechatProfileSkipped()
  assert.equal(onboarding.isWechatProfileSkipped(), false)
  assert.equal(onboarding.getLoginRoute(bundle), '/pages/init/init')
})

test('首次进入标记可写入和清除，用于决定是否自动登录', () => {
  onboarding.clearEnteredApp()
  assert.equal(onboarding.hasEnteredApp(), false)

  onboarding.markEnteredApp()
  assert.equal(onboarding.hasEnteredApp(), true)

  onboarding.clearEnteredApp()
  assert.equal(onboarding.hasEnteredApp(), false)
})

test('启动首页是可浏览的总览，登录页作为非首页注册', () => {
  const appConfig = require('../app.json')
  assert.equal(appConfig.pages[0], 'pages/overview/overview')
  assert.equal(appConfig.pages.includes('pages/index/index'), true)
})
