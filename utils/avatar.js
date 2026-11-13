const config = require('../config/index')

function readFileBase64(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success(result) {
        resolve(result.data)
      },
      fail() {
        reject(new Error('读取头像文件失败，请重新选择头像'))
      }
    })
  })
}

function compressImage(src, quality) {
  return new Promise((resolve, reject) => {
    if (typeof wx.compressImage !== 'function') {
      reject(
        new Error('当前微信版本不支持头像压缩，请选择更小的图片')
      )
      return
    }

    wx.compressImage({
      src,
      quality,
      success(result) {
        if (result && result.tempFilePath) {
          resolve(result.tempFilePath)
          return
        }
        reject(new Error('头像压缩失败，请重新选择'))
      },
      fail() {
        reject(new Error('头像压缩失败，请重新选择'))
      }
    })
  })
}

function base64ByteLength(base64) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

async function prepareAvatarBase64(filePath) {
  let base64 = await readFileBase64(filePath)
  if (base64ByteLength(base64) <= config.maxAvatarBytes) {
    return base64
  }

  let compressedPath = await compressImage(filePath, 60)
  base64 = await readFileBase64(compressedPath)
  if (base64ByteLength(base64) <= config.maxAvatarBytes) {
    return base64
  }

  compressedPath = await compressImage(compressedPath, 35)
  base64 = await readFileBase64(compressedPath)
  if (base64ByteLength(base64) <= config.maxAvatarBytes) {
    return base64
  }

  throw new Error('头像文件过大，请重新选择一张更小的图片')
}

module.exports = {
  prepareAvatarBase64
}
