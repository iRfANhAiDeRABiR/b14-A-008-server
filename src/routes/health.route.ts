import { Router, Request, Response } from "express"

const router = Router()

router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "TogetherWeCare API is running",
    status: "healthy",
  })
})

export default router

