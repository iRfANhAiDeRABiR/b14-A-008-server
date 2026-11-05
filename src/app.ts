import express, { Express, Request, Response } from "express"
import helmet from "helmet"
import { corsMiddleware } from "./config/cors.js"
import { requestLogger } from "./middlewares/request-logger.js"
import { notFoundHandler } from "./middlewares/not-found.js"
import { globalErrorHandler } from "./middlewares/global-error-handler.js"
import { authenticate } from "./middlewares/auth.js"
import healthRouter from "./routes/health.route.js"
import eventRouter from "./routes/event.routes.js"

const app: Express = express()

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)

app.use(corsMiddleware)

app.use(requestLogger)

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

app.use("/api/health", healthRouter)
app.use("/api/events", eventRouter)

app.get("/api/test-auth", authenticate, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "JWT verified successfully",
    user: {
      userId: req.user?.userId,
      email: req.user?.email,
      name: req.user?.name,
    },
  })
})

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "TogetherWeCare Server is running",
  })
})

app.use(notFoundHandler)

app.use(globalErrorHandler)

export { app }
export default app
