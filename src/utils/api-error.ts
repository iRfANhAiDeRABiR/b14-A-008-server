export class ApiError extends Error {
  public readonly statusCode: number
  public readonly details: unknown

  constructor(statusCode: number, message: string, details: unknown = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = "Bad Request", details: unknown = null): ApiError {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = "Unauthorized", details: unknown = null): ApiError {
    return new ApiError(401, message, details)
  }

  static forbidden(message = "Forbidden", details: unknown = null): ApiError {
    return new ApiError(403, message, details)
  }

  static notFound(message = "Not Found", details: unknown = null): ApiError {
    return new ApiError(404, message, details)
  }

  static conflict(message = "Conflict", details: unknown = null): ApiError {
    return new ApiError(409, message, details)
  }

  static unprocessable(message = "Unprocessable Entity", details: unknown = null): ApiError {
    return new ApiError(422, message, details)
  }

  static tooManyRequests(message = "Too many requests, please try again later", details: unknown = null): ApiError {
    return new ApiError(429, message, details)
  }

  static internal(message = "Internal Server Error", details: unknown = null): ApiError {
    return new ApiError(500, message, details)
  }
}

