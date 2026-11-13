const { AppError } = require('./errors')

function detectImageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return { ext: 'png', mime: 'image/png' }
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' }
  }

  return null
}

function decodeAvatarBase64(base64, maxBytes) {
  let buffer
  try {
    buffer = Buffer.from(base64, 'base64')
  } catch {
    throw new AppError('INVALID_AVATAR', '头像文件格式不正确')
  }

  if (!buffer.length) {
    throw new AppError('INVALID_AVATAR', '头像文件为空')
  }
  if (buffer.length > maxBytes) {
    throw new AppError(
      'AVATAR_TOO_LARGE',
      `头像文件不能超过 ${Math.round(maxBytes / 1024)}KB`
    )
  }

  const type = detectImageType(buffer)
  if (!type) {
    throw new AppError('INVALID_AVATAR', '仅支持 JPG、PNG、WebP 图片作为头像')
  }

  return {
    buffer,
    ext: type.ext,
    mime: type.mime
  }
}

module.exports = {
  decodeAvatarBase64,
  detectImageType
}
