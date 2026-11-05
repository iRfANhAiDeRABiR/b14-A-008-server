import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import { mutationLimiter } from "../middlewares/rate-limiter.js"
import {
  createEvent,
  deleteEvent,
  getEventById,
  getJoinStatus,
  getJoinedEvents,
  getMyEvents,
  getUpcomingEvents,
  joinEvent,
  updateEvent,
} from "../controllers/event.controller.js"

const router = Router()

router.get("/", getUpcomingEvents)
router.get("/my-events", authenticate, getMyEvents)
router.get("/joined", authenticate, getJoinedEvents)
router.get("/:id", getEventById)
router.get("/:id/join-status", authenticate, getJoinStatus)
router.post("/", authenticate, mutationLimiter, createEvent)
router.post("/:id/join", authenticate, mutationLimiter, joinEvent)
router.patch("/:id", authenticate, mutationLimiter, updateEvent)
router.delete("/:id", authenticate, mutationLimiter, deleteEvent)

export default router
