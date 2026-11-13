const MAX_GAME_NICKNAME_LENGTH = 30
const MAX_WECHAT_NICKNAME_LENGTH = 30
const MAX_TOTAL_POWER = 999999999999
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/
const CORE_ATTRIBUTE_KEYS = [
  'infantryHp',
  'infantryDefense',
  'archerAttack',
  'archerDestruction',
  'cavalryAttack',
  'cavalryDestruction',
  'rallyDamageBonus',
  'rallyDamageReduction',
  'marchCapacity'
]
const INTEGER_ATTRIBUTE_KEYS = ['marchCapacity']
const MAX_CORE_PERCENT = 999999.99
const MAX_MARCH_CAPACITY = 999999999

function codePointLength(value) {
  return Array.from(value).length
}

function validateGameNickname(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : ''
  if (!value) {
    return { ok: false, value, message: '请输入游戏昵称' }
  }
  if (CONTROL_CHARACTERS.test(value)) {
    return { ok: false, value, message: '游戏昵称包含非法字符' }
  }
  if (codePointLength(value) > MAX_GAME_NICKNAME_LENGTH) {
    return {
      ok: false,
      value,
      message: `游戏昵称不能超过 ${MAX_GAME_NICKNAME_LENGTH} 个字符`
    }
  }
  return { ok: true, value, message: '' }
}

function validateTotalPower(rawValue) {
  const value = String(rawValue === undefined || rawValue === null ? '' : rawValue).trim()
  if (!value) {
    return { ok: false, value, message: '请输入当前总战力' }
  }
  if (!/^\d{1,12}$/.test(value)) {
    return { ok: false, value, message: '当前总战力只能填写数字' }
  }
  const power = Number(value)
  if (!Number.isSafeInteger(power) || power < 0 || power > MAX_TOTAL_POWER) {
    return { ok: false, value, message: '当前总战力超出可填写范围' }
  }
  return { ok: true, power, value, message: '' }
}

function validateGender(value) {
  if (!['male', 'female', 'secret'].includes(value)) {
    return { ok: false, value: '', message: '请选择性别' }
  }
  return { ok: true, value, message: '' }
}

function validateCoreAttributeValue(key, rawValue) {
  const text = String(
    rawValue === undefined || rawValue === null ? '' : rawValue
  ).trim()

  if (!text) {
    return { ok: true, value: null, message: '' }
  }

  if (INTEGER_ATTRIBUTE_KEYS.indexOf(key) !== -1) {
    if (!/^\d{1,9}$/.test(text)) {
      return {
        ok: false,
        value: null,
        message: '只能填写非负整数'
      }
    }
    const value = Number(text)
    if (!Number.isSafeInteger(value) || value > MAX_MARCH_CAPACITY) {
      return {
        ok: false,
        value: null,
        message: '超出可填写范围'
      }
    }
    return { ok: true, value, message: '' }
  }

  if (!/^\d{1,6}(\.\d{1,2})?$/.test(text)) {
    return {
      ok: false,
      value: null,
      message: '只能填写数字，最多两位小数'
    }
  }
  const value = Number(text)
  if (!Number.isFinite(value) || value > MAX_CORE_PERCENT) {
    return {
      ok: false,
      value: null,
      message: '超出可填写范围'
    }
  }
  return { ok: true, value, message: '' }
}

function validateWechatNickname(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : ''
  if (!value) {
    return { ok: false, value, message: '请填写微信昵称' }
  }
  if (CONTROL_CHARACTERS.test(value)) {
    return { ok: false, value, message: '微信昵称包含非法字符' }
  }
  if (codePointLength(value) > MAX_WECHAT_NICKNAME_LENGTH) {
    return {
      ok: false,
      value,
      message: `微信昵称不能超过 ${MAX_WECHAT_NICKNAME_LENGTH} 个字符`
    }
  }
  return { ok: true, value, message: '' }
}

module.exports = {
  CORE_ATTRIBUTE_KEYS,
  validateCoreAttributeValue,
  validateGameNickname,
  validateTotalPower,
  validateGender,
  validateWechatNickname
}
