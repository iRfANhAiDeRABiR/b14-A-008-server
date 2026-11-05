import rateLimit from "express-rate-limit"
import { Request, Response } from "express"

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GENERAL_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
    error: null,
  },
  handler: (_req: Request, res: Response, _next, options) => {
    res.status(options.statusCode).json(options.message)
  },
})

export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MUTATION_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests for sensitive operations, please try again later",
    error: null,
  },
  handler: (_req: Request, res: Response, _next, options) => {
    res.status(options.statusCode).json(options.message)
  },
})

