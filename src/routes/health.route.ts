import { Router, Request, Response } from "express"
import { isDatabaseConnected } from "../config/db.js"

const router = Router()

router.get("/", async (_req: Request, res: Response) => {
  try {
    const connected = await isDatabaseConnected()

    if (!connected) {
      res.status(503).json({
        success: false,
        message: "TogetherWeCare API is running but database is disconnected",
        status: "unhealthy",
        database: "disconnected",
      })
      return
    }

    res.status(200).json({
      success: true,
      message: "TogetherWeCare API is running",
      status: "healthy",
      database: "connected",
    })
  } catch {
    res.status(503).json({
      success: false,
      message: "Database ping failed",
      status: "unhealthy",
      database: "disconnected",
    })
  }
})

export default router
