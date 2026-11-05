import { Filter, ObjectId, Sort } from "mongodb"
import { getEventsCollection } from "../config/collections.js"
import {
  EventCreator,
  EventDocument,
  EventType,
  PublicEventItem,
  UpcomingEventsResponse,
} from "../types/event.js"
import {
  CreateEventSchemaType,
  GetUpcomingEventsQueryParams,
  isStrictFutureDate,
} from "../validations/event.validation.js"
import { getUpcomingDateBoundary, parseEventDate } from "../utils/date.js"
import { ApiError } from "../utils/api-error.js"

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

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

export async function getUpcomingEventsFromDb(
  params: GetUpcomingEventsQueryParams
): Promise<UpcomingEventsResponse> {
  const boundary = getUpcomingDateBoundary()

  const filter: Filter<EventDocument> = {
    eventDate: { $gte: boundary },
  }

  if (params.eventType && params.eventType !== "all") {
    filter.eventType = params.eventType as EventType
  }

  if (params.location && params.location.trim()) {
    const escaped = escapeRegex(params.location.trim())
    filter.location = { $regex: new RegExp(escaped, "i") }
  }

  if (params.search && params.search.trim()) {
    const escapedSearch = escapeRegex(params.search.trim())
    const searchRegex = new RegExp(escapedSearch, "i")
    const searchConditions: Filter<EventDocument>[] = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { location: { $regex: searchRegex } },
    ]

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }]
      delete filter.$or
    } else {
      filter.$or = searchConditions
    }
  }

  const sortDirection = params.sort === "latest" ? -1 : 1
  const sortCriteria: Sort = { eventDate: sortDirection }

  const page = params.page ?? 1
  const limit = params.limit ?? 6
  const skip = (page - 1) * limit

  const collection = getEventsCollection()

  const totalEvents = await collection.countDocuments(filter)
  const totalPages = totalEvents === 0 ? 0 : Math.ceil(totalEvents / limit)

  const docs = await collection
    .find(filter)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .toArray()

  const events: PublicEventItem[] = docs.map((doc) => ({
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    imageUrl: doc.imageUrl,
    location: doc.location,
    eventDate: doc.eventDate.toISOString(),
    createdBy: {
      name: doc.createdBy?.name || "Organizer",
    },
    joinedCount: doc.joinedCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }))

  return {
    events,
    pagination: {
      currentPage: page,
      totalPages,
      totalEvents,
      limit,
    },
  }
}
