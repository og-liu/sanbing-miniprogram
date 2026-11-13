const GENDER_LABELS = {
  male: '男',
  female: '女',
  secret: '保密'
}

const CORE_ATTRIBUTES = [
  { key: 'infantryHp', label: '步兵生命', unit: '%' },
  { key: 'infantryDefense', label: '步兵防御', unit: '%' },
  { key: 'archerAttack', label: '弓兵攻击', unit: '%' },
  { key: 'archerDestruction', label: '弓兵破坏', unit: '%' },
  { key: 'cavalryAttack', label: '骑兵攻击', unit: '%' },
  { key: 'cavalryDestruction', label: '骑兵破坏', unit: '%' },
  { key: 'rallyDamageBonus', label: '集结伤害加成', unit: '%' },
  { key: 'rallyDamageReduction', label: '集结伤害减免', unit: '%' },
  { key: 'marchCapacity', label: '出征兵力上限', unit: '' }
]

const ORGANIZATION_TEXT = {
  serverUnjoined: '暂未加入任何区服',
  guildUnjoined: '暂未加入任何同盟',
}

function getGenderLabel(gender) {
  return GENDER_LABELS[gender] || '未设置'
}

function formatCoreAttributeValue(value, unit) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—'
  }
  if (unit === '%') {
    return String(Number(value.toFixed(2)))
  }
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function normalizeCoreAttributes(attributes) {
  const source = attributes || {}
  const result = {}
  CORE_ATTRIBUTES.forEach((item) => {
    result[item.key] =
      typeof source[item.key] === 'number' && Number.isFinite(source[item.key])
        ? source[item.key]
        : null
  })
  return result
}

function formatPower(totalPower) {
  if (typeof totalPower !== 'number' || !Number.isFinite(totalPower)) {
    return '未设置'
  }
  return String(Math.trunc(totalPower)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getOrganizationText(organization) {
  const org = organization || {}
  return {
    server:
      org.server === 'unjoined' || !org.server
        ? ORGANIZATION_TEXT.serverUnjoined
        : '已加入区服',
    guild:
      org.guild === 'unjoined' || !org.guild
        ? ORGANIZATION_TEXT.guildUnjoined
        : '已加入同盟',
  }
}

function buildProfileView(bundle) {
  const safeBundle = bundle || {}
  const user = safeBundle.user || {}
  const wechat = user.wechat || {}
  const profile = safeBundle.gameProfile || null
  const organization = profile ? profile.organization : null
  const organizationText = getOrganizationText(organization)

  return {
    initialized: Boolean(safeBundle.initialized && profile),
    wechatNickname: wechat.nickname || '',
    hasWechatNickname: Boolean(wechat.nickname),
    hasWechatAvatar:
      wechat.hasAvatar === undefined
        ? Boolean(wechat.avatarUrl)
        : Boolean(wechat.hasAvatar),
    avatarSrc: wechat.avatarUrl || '',
    wechatProfileComplete: Boolean(wechat.isComplete),
    gameNickname: profile ? profile.gameNickname : '',
    gender: profile ? profile.gender : '',
    totalPower:
      profile && typeof profile.totalPower === 'number'
        ? profile.totalPower
        : null,
    genderLabel: profile ? getGenderLabel(profile.gender) : '未设置',
    totalPowerDisplay: profile ? formatPower(profile.totalPower) : '未设置',
    organizationServerText: organizationText.server,
    organizationGuildText: organizationText.guild,
    coreAttributes: normalizeCoreAttributes(
      profile ? profile.attributes : null
    ),
    coreAttributeItems: CORE_ATTRIBUTES.map((item) => {
      const value =
        profile &&
        profile.attributes &&
        typeof profile.attributes[item.key] === 'number'
          ? profile.attributes[item.key]
          : null
      return {
        ...item,
        value,
        hasValue: value !== null,
        display: formatCoreAttributeValue(value, item.unit)
      }
    })
  }
}

module.exports = {
  CORE_ATTRIBUTES,
  formatPower,
  buildProfileView
}
