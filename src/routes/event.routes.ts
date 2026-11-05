import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { createEvent } from "../controllers/event.controller.js"

const router = Router()

router.post("/", authenticate, createEvent)

export default router
