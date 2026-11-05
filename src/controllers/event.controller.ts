import { Request, Response, NextFunction } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/db.js"
import { ApiError } from "../utils/api-error.js"
import {
  createEventSchema,
  getUpcomingEventsQuerySchema,
  isValidObjectId,
  updateEventSchema,
} from "../validations/event.validation.js"
import {
  createEventInDb,
  deleteEventInDb,
  getEventByIdFromDb,
  getJoinStatusFromDb,
  getJoinedEventsFromDb,
  getMyEventsFromDb,
  getUpcomingEventsFromDb,
  joinEventInDb,
  updateEventInDb,
} from "../services/event.service.js"
import { EventCreator } from "../types/event.js"

export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required to create an event")
    }

    if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0) {
      throw ApiError.badRequest("Request body cannot be empty")
    }

    if (
      "createdBy" in req.body ||
      "_id" in req.body ||
      "createdAt" in req.body ||
      "updatedAt" in req.body
    ) {
      throw ApiError.badRequest(
        "Unexpected fields provided. Creator identity and system fields cannot be set by the client"
      )
    }

    const validationResult = createEventSchema.safeParse(req.body)

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]
      const errorMessage = firstIssue ? firstIssue.message : "Validation failed"
      throw ApiError.badRequest(errorMessage, validationResult.error.issues)
    }

    let userEmail = user.email
    let userName = user.name

    if (!userEmail || !userName) {
      try {
        const db = getDb()
        const userCollection = db.collection("user")
        const filter = ObjectId.isValid(user.userId)
          ? { $or: [{ _id: new ObjectId(user.userId) }, { id: user.userId }] }
          : { id: user.userId }
        const userDoc = await userCollection.findOne(filter)
        if (userDoc) {
          if (!userEmail && typeof userDoc.email === "string") {
            userEmail = userDoc.email
          }
          if (!userName && typeof userDoc.name === "string") {
            userName = userDoc.name
          }
        }
      } catch {
      }
    }

    const creator: EventCreator = {
      userId: user.userId,
      email: userEmail || "community@togetherwecare.org",
      name: userName || "Community Member",
    }

    const createdEvent = await createEventInDb(validationResult.data, creator)

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: {
        event: createdEvent,
      },
      event: createdEvent,
    })
  } catch (error) {
    next(error)
  }
}

export async function getUpcomingEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationResult = getUpcomingEventsQuerySchema.safeParse(req.query)

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]
      const errorMessage = firstIssue ? firstIssue.message : "Invalid query parameters"
      throw ApiError.badRequest(errorMessage, validationResult.error.issues)
    }

    const { events, pagination } = await getUpcomingEventsFromDb(validationResult.data)

    const message =
      events.length === 0
        ? "No upcoming events found"
        : "Upcoming events retrieved successfully"

    res.status(200).json({
      success: true,
      message,
      events,
      pagination,
      data: {
        events,
        pagination,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getEventById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) {
      throw ApiError.badRequest("Invalid event ID")
    }

    const event = await getEventByIdFromDb(id)

    if (!event) {
      throw ApiError.notFound("Event not found")
    }

    res.status(200).json({
      success: true,
      message: "Event details retrieved successfully",
      data: {
        event,
      },
      event,
    })
  } catch (error) {
    next(error)
  }
}

export async function getMyEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required")
    }

    const events = await getMyEventsFromDb(user.userId)

    res.status(200).json({
      success: true,
      message: "Your events retrieved successfully",
      events,
      data: {
        events,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required")
    }

    const { id } = req.params

    if (!isValidObjectId(id)) {
      throw ApiError.badRequest("Invalid event ID")
    }

    if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0) {
      throw ApiError.badRequest("Request body cannot be empty")
    }

    if (
      "createdBy" in req.body ||
      "_id" in req.body ||
      "createdAt" in req.body ||
      "userId" in req.body ||
      "email" in req.body ||
      "name" in req.body
    ) {
      throw ApiError.badRequest(
        "Unexpected fields provided. Protected system fields cannot be modified"
      )
    }

    const validationResult = updateEventSchema.safeParse(req.body)

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]
      const errorMessage = firstIssue ? firstIssue.message : "Validation failed"
      throw ApiError.badRequest(errorMessage, validationResult.error.issues)
    }

    const updatedEvent = await updateEventInDb(id, user.userId, validationResult.data)

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
      data: {
        event: updatedEvent,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required")
    }

    const { id } = req.params

    if (!isValidObjectId(id)) {
      throw ApiError.badRequest("Invalid event ID")
    }

    const result = await deleteEventInDb(id, user.userId)

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: {
        deletedEventId: result.deletedEventId,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function joinEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required to join an event")
    }

    const { id } = req.params

    if (!isValidObjectId(id)) {
      throw ApiError.badRequest("Invalid event ID")
    }

    const participation = await joinEventInDb(id, user)

    res.status(201).json({
      success: true,
      message: "You have successfully joined this event",
      data: {
        participation,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getJoinStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required")
    }

    const { id } = req.params

    if (!isValidObjectId(id)) {
      throw ApiError.badRequest("Invalid event ID")
    }

    const hasJoined = await getJoinStatusFromDb(id, user.userId)

    res.status(200).json({
      success: true,
      data: {
        hasJoined,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getJoinedEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user

    if (!user || !user.userId) {
      throw ApiError.unauthorized("Authentication required")
    }

    const joinedEvents = await getJoinedEventsFromDb(user.userId)

    const message =
      joinedEvents.length === 0
        ? "You have not joined any events yet"
        : "Joined events retrieved successfully"

    res.status(200).json({
      success: true,
      message,
      joinedEvents,
      data: {
        joinedEvents,
      },
    })
  } catch (error) {
    next(error)
  }
}
