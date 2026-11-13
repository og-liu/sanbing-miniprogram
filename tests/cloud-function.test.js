const assert = require('assert')
const test = require('node:test')

const validation = require('../cloudfunctions/sanbingAccount/lib/validation')
const avatar = require('../cloudfunctions/sanbingAccount/lib/avatar')

function assertErrorCode(fn, expectedCode) {
  try {
    fn()
    assert.fail('expected validation error')
  } catch (error) {
    assert.equal(error.code, expectedCode)
  }
}

test('游戏角色资料字段校验', () => {
  const valid = validation.validateGameProfileInput({
    action: 'saveGameProfile',
    gameNickname: '  冰河战神  ',
    totalPower: 123456,
    gender: 'male'
  })
  assert.equal(valid.gameNickname, '冰河战神')
  assert.equal(valid.totalPower, 123456)
  assert.equal(valid.gender, 'male')

  assertErrorCode(
    () =>
      validation.validateGameProfileInput({
        gameNickname: '   ',
        totalPower: 1,
        gender: 'male'
      }),
    'INVALID_NICKNAME'
  )
  assertErrorCode(
    () =>
      validation.validateGameProfileInput({
        gameNickname: '玩家',
        totalPower: '1',
        gender: 'male'
      }),
    'INVALID_TOTAL_POWER'
  )
  assertErrorCode(
    () =>
      validation.validateGameProfileInput({
        gameNickname: '玩家',
        totalPower: 1.5,
        gender: 'male'
      }),
    'INVALID_TOTAL_POWER'
  )
  assertErrorCode(
    () =>
      validation.validateGameProfileInput({
        gameNickname: '玩家',
        totalPower: 1,
        gender: 'unknown'
      }),
    'INVALID_GENDER'
  )
})

test('微信昵称与头像 Base64 校验', () => {
  const valid = validation.validateWechatProfileInput(
    { nickname: ' 测试用户 ' },
    500 * 1024
  )
  assert.equal(valid.nickname, '测试用户')

  assertErrorCode(
    () =>
      validation.validateWechatProfileInput(
        { nickname: '', avatarBase64: 'AAAA' },
        500 * 1024
      ),
    'INVALID_NICKNAME'
  )
  assertErrorCode(
    () =>
      validation.validateWechatProfileInput(
        { nickname: '测试用户', avatarBase64: 'not base64' },
        500 * 1024
      ),
    'INVALID_AVATAR'
  )

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  )
  assert.equal(
    avatar.decodeAvatarBase64(tinyPng.toString('base64'), 500 * 1024).ext,
    'png'
  )
  assertErrorCode(
    () =>
      avatar.decodeAvatarBase64(
        Buffer.from('not an image').toString('base64'),
        500 * 1024
      ),
    'INVALID_AVATAR'
  )

  const oversized = Buffer.alloc(500 * 1024 + 1, 0)
  oversized[0] = 0xff
  oversized[1] = 0xd8
  oversized[2] = 0xff
  assertErrorCode(
    () =>
      avatar.decodeAvatarBase64(
        oversized.toString('base64'),
        500 * 1024
      ),
    'AVATAR_TOO_LARGE'
  )
})

test('核心属性校验：百分比最多两位小数，兵力上限必须为整数', () => {
  const valid = validation.validateGameProfileUpdateInput({
    gameNickname: '示例角色',
    totalPower: 123456,
    gender: 'male',
    attributes: {
      infantryHp: 12.5,
      infantryDefense: null,
      archerAttack: 8,
      archerDestruction: '',
      cavalryAttack: 0,
      cavalryDestruction: null,
      rallyDamageBonus: 3.25,
      rallyDamageReduction: null,
      marchCapacity: 120000
    }
  })

  assert.equal(valid.attributes.infantryHp, 12.5)
  assert.equal(valid.attributes.infantryDefense, null)
  assert.equal(valid.attributes.archerDestruction, null)
  assert.equal(valid.attributes.marchCapacity, 120000)

  assertErrorCode(
    () =>
      validation.validateGameProfileUpdateInput({
        gameNickname: '示例角色',
        totalPower: 1,
        gender: 'male',
        attributes: { infantryHp: 1.234 }
      }),
    'INVALID_CORE_ATTRIBUTE'
  )

  assertErrorCode(
    () =>
      validation.validateGameProfileUpdateInput({
        gameNickname: '示例角色',
        totalPower: 1,
        gender: 'male',
        attributes: { marchCapacity: 1.5 }
      }),
    'INVALID_CORE_ATTRIBUTE'
  )

  assertErrorCode(
    () =>
      validation.validateGameProfileUpdateInput({
        gameNickname: '示例角色',
        totalPower: 1,
        gender: 'male'
      }),
    'INVALID_CORE_ATTRIBUTE'
  )
})
