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
    const responsePayload: Record<string, unknown> = {
      success: false,
      message: err.message,
      error: err.details,
    }

    if (err.details && typeof err.details === "object" && !Array.isArray(err.details)) {
      Object.assign(responsePayload, err.details)
    }

    res.status(err.statusCode).json(responsePayload)
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

  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    (err as { type: unknown }).type === "entity.too.large"
  ) {
    res.status(413).json({
      success: false,
      message: "Request entity too large. Maximum allowed payload size is 1MB.",
      error: null,
    })
    return
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "Duplicate entry conflict",
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

  const rawMessage = err instanceof Error ? err.message : String(err)
  const sanitizedMessage = rawMessage.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
  console.error("Unhandled Error:", sanitizedMessage)

  res.status(500).json({
    success: false,
    message,
    error: null,
  })
}
