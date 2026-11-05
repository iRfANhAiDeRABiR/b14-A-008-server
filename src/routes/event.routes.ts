import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import {
  createEvent,
  getEventById,
  getUpcomingEvents,
} from "../controllers/event.controller.js"

const router = Router()

router.get("/", getUpcomingEvents)
router.get("/:id", getEventById)
router.post("/", authenticate, createEvent)

export default router
