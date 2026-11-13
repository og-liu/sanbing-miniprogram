class AppError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.isOperational = true
  }
}

module.exports = {
  AppError
}
