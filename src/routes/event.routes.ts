import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { createEvent, getUpcomingEvents } from "../controllers/event.controller.js"

const router = Router()

router.get("/", getUpcomingEvents)
router.post("/", authenticate, createEvent)

export default router
