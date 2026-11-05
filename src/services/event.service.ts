import { ObjectId } from "mongodb"
import { getEventsCollection } from "../config/collections.js"
import { EventCreator, EventDocument, EventType } from "../types/event.js"
import { CreateEventSchemaType, isStrictFutureDate } from "../validations/event.validation.js"
import { parseEventDate } from "../utils/date.js"
import { ApiError } from "../utils/api-error.js"

export async function createEventInDb(
  data: CreateEventSchemaType,
  creator: EventCreator
): Promise<EventDocument> {
  const parsedDate = parseEventDate(data.eventDate)

  if (!isStrictFutureDate(parsedDate)) {
    throw ApiError.badRequest(
      "Event date must be strictly in the future (starting from tomorrow)"
    )
  }

  const now = new Date()
  const newEventId = new ObjectId()

  const eventDoc: EventDocument = {
    _id: newEventId,
    title: data.title.trim(),
    description: data.description.trim(),
    eventType: data.eventType as EventType,
    imageUrl: data.imageUrl.trim(),
    location: data.location.trim(),
    eventDate: parsedDate,
    createdBy: {
      userId: creator.userId,
      email: creator.email,
      name: creator.name,
    },
    joinedCount: 0,
    createdAt: now,
    updatedAt: now,
  }

  const collection = getEventsCollection()
  const result = await collection.insertOne(eventDoc)

  if (!result.acknowledged) {
    throw ApiError.internal("Failed to insert event into database")
  }

  return eventDoc
}
