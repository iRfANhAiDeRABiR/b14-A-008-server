import { Request, Response } from "express"

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: "API route not found",
    error: {
      path: req.originalUrl,
      method: req.method,
    },
  })
}

