import { Router } from "express"
import { authenticate } from "../middlewares/auth.js"
import {
  createEvent,
  deleteEvent,
  getEventById,
  getJoinStatus,
  getMyEvents,
  getUpcomingEvents,
  joinEvent,
  updateEvent,
} from "../controllers/event.controller.js"

const router = Router()

router.get("/", getUpcomingEvents)
router.get("/my-events", authenticate, getMyEvents)
router.get("/:id", getEventById)
router.get("/:id/join-status", authenticate, getJoinStatus)
router.post("/", authenticate, createEvent)
router.post("/:id/join", authenticate, joinEvent)
router.patch("/:id", authenticate, updateEvent)
router.delete("/:id", authenticate, deleteEvent)

export default router
