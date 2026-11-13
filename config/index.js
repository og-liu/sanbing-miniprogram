/**
 * 小程序端环境配置。
 *
 * 当前第一期使用微信云开发，不再需要自建 HTTPS API 域名。
 * 云环境为 sanbing-prod；云函数部署在 cloudfunctions/sanbingAccount。
 */
const CLOUD_ENV_ID = 'cloud1-d6gldy1dwe50f247a'
const CLOUD_FUNCTION_NAME = 'sanbingAccount'

module.exports = {
  cloudEnvId: CLOUD_ENV_ID,
  cloudFunctionName: CLOUD_FUNCTION_NAME,
  maxAvatarBytes: 500 * 1024
}
