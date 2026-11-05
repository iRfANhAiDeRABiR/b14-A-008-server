import { Request, Response, NextFunction } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/db.js"
import { ApiError } from "../utils/api-error.js"
import {
  createEventSchema,
  getUpcomingEventsQuerySchema,
} from "../validations/event.validation.js"
import {
  createEventInDb,
  getUpcomingEventsFromDb,
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
