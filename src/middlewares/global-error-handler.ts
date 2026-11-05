import { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/api-error.js"

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.details,
    })
    return
  }

  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status: unknown }).status === 400 &&
    "body" in err
  ) {
    res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body",
      error: null,
    })
    return
  }

  if (err instanceof Error && err.message.startsWith("CORS blocked")) {
    res.status(403).json({
      success: false,
      message: err.message,
      error: null,
    })
    return
  }

  const isProduction = process.env.NODE_ENV === "production"
  const message = isProduction
    ? "Internal Server Error"
    : err instanceof Error
    ? err.message
    : "Something went wrong"

  console.error("Unhandled Error:", err instanceof Error ? err.message : err)

  res.status(500).json({
    success: false,
    message,
    error: null,
  })
}

