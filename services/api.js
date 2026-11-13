const config = require('../config/index')

class CloudError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'CloudError'
    this.code = code || 'CLOUD_ERROR'
  }
}

function isAuthError(error) {
  return Boolean(error && error.code === 'UNAUTHORIZED')
}

function cloudFailureMessage(error) {
  const raw = String((error && (error.errMsg || error.message)) || '')
  if (/not found|function.*not exist|FunctionName/i.test(raw)) {
    return '云端账号服务尚未部署或环境配置异常'
  }
  if (/timeout|超时/i.test(raw)) {
    return '云端服务响应超时，请稍后重试'
  }
  if (/env|environment|环境/i.test(raw)) {
    return '云开发环境配置异常，请稍后重试'
  }
  return '云端服务连接失败，请检查网络后重试'
}

function call(action, data) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(
        new CloudError(
          '当前微信基础库不支持云开发，请升级微信或基础库',
          'CLOUD_UNSUPPORTED'
        )
      )
      return
    }

    wx.cloud.callFunction({
      name: config.cloudFunctionName,
      data: {
        ...(data || {}),
        action
      },
      success(result) {
        const payload = result && result.result
        if (!payload || typeof payload !== 'object') {
          reject(
            new CloudError(
              '云端账号服务响应异常，请稍后重试',
              'BAD_CLOUD_RESPONSE'
            )
          )
          return
        }
        if (payload.ok === true) {
          resolve(payload.data)
          return
        }
        if (payload.ok === false && payload.error) {
          reject(
            new CloudError(
              payload.error.message || '云端操作失败，请稍后重试',
              payload.error.code || 'CLOUD_ERROR'
            )
          )
          return
        }
        reject(
          new CloudError(
            '云端账号服务响应异常，请稍后重试',
            'BAD_CLOUD_RESPONSE'
          )
        )
      },
      fail(error) {
        reject(
          new CloudError(
            cloudFailureMessage(error),
            'CLOUD_CALL_FAILED'
          )
        )
      }
    })
  })
}

module.exports = {
  call,
  isAuthError
}
