import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import {
  createEvent,
  deleteEvent,
  getEventById,
  getMyEvents,
  getUpcomingEvents,
  updateEvent,
} from "../controllers/event.controller.js"

const router = Router()

router.get("/", getUpcomingEvents)
router.get("/my-events", authenticate, getMyEvents)
router.get("/:id", getEventById)
router.post("/", authenticate, createEvent)
router.patch("/:id", authenticate, updateEvent)
router.delete("/:id", authenticate, deleteEvent)

export default router
