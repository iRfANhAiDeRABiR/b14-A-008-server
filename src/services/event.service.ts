import { Filter, ObjectId, Sort } from "mongodb"
import { getDb } from "../config/db.js"
import {
  getEventsCollection,
  getJoinedEventsCollection,
} from "../config/collections.js"
import {
  EventCreator,
  EventDocument,
  EventType,
  PublicEventItem,
  UpcomingEventsResponse,
} from "../types/event.js"
import { JoinedEventDocument } from "../types/joined-event.js"
import {
  CreateEventSchemaType,
  GetUpcomingEventsQueryParams,
  UpdateEventSchemaType,
  isStrictFutureDate,
  isValidObjectId,
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

export async function getEventByIdFromDb(
  eventId: string
): Promise<PublicEventItem | null> {
  if (!isValidObjectId(eventId)) {
    throw ApiError.badRequest("Invalid event ID")
  }

  const collection = getEventsCollection()
  const doc = await collection.findOne({ _id: new ObjectId(eventId) })

  if (!doc) {
    return null
  }

  return {
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    imageUrl: doc.imageUrl,
    location: doc.location,
    eventDate: doc.eventDate.toISOString(),
    createdBy: {
      name: doc.createdBy?.name || "Community Organizer",
    },
    joinedCount: doc.joinedCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function getMyEventsFromDb(userId: string): Promise<any[]> {
  const collection = getEventsCollection()
  const docs = await collection
    .find({ "createdBy.userId": userId })
    .sort({ eventDate: 1 })
    .toArray()

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    imageUrl: doc.imageUrl,
    location: doc.location,
    eventDate: doc.eventDate.toISOString(),
    createdBy: {
      userId: doc.createdBy.userId,
      email: doc.createdBy.email,
      name: doc.createdBy.name,
    },
    joinedCount: doc.joinedCount ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }))
}

export async function updateEventInDb(
  eventId: string,
  userId: string,
  updateData: UpdateEventSchemaType
): Promise<any> {
  if (!isValidObjectId(eventId)) {
    throw ApiError.badRequest("Invalid event ID")
  }

  const collection = getEventsCollection()
  const eventObjectId = new ObjectId(eventId)
  const existing = await collection.findOne({ _id: eventObjectId })

  if (!existing) {
    throw ApiError.notFound("Event not found")
  }

  if (existing.createdBy.userId !== userId) {
    throw ApiError.forbidden("You are not authorized to update this event")
  }

  const updateFields: Partial<EventDocument> = {
    updatedAt: new Date(),
  }

  if (updateData.title !== undefined) {
    updateFields.title = updateData.title.trim()
  }
  if (updateData.description !== undefined) {
    updateFields.description = updateData.description.trim()
  }
  if (updateData.eventType !== undefined) {
    updateFields.eventType = updateData.eventType as EventType
  }
  if (updateData.imageUrl !== undefined) {
    updateFields.imageUrl = updateData.imageUrl.trim()
  }
  if (updateData.location !== undefined) {
    updateFields.location = updateData.location.trim()
  }
  if (updateData.eventDate !== undefined) {
    const parsed = parseEventDate(updateData.eventDate)
    if (!isStrictFutureDate(parsed)) {
      throw ApiError.badRequest(
        "Event date must be strictly in the future (starting from tomorrow)"
      )
    }
    updateFields.eventDate = parsed
  }

  const updatedDoc = await collection.findOneAndUpdate(
    { _id: eventObjectId, "createdBy.userId": userId },
    { $set: updateFields },
    { returnDocument: "after" }
  )

  if (!updatedDoc) {
    throw ApiError.notFound("Event not found or unauthorized")
  }

  return {
    _id: updatedDoc._id.toString(),
    title: updatedDoc.title,
    description: updatedDoc.description,
    eventType: updatedDoc.eventType,
    imageUrl: updatedDoc.imageUrl,
    location: updatedDoc.location,
    eventDate: updatedDoc.eventDate.toISOString(),
    createdBy: {
      userId: updatedDoc.createdBy.userId,
      email: updatedDoc.createdBy.email,
      name: updatedDoc.createdBy.name,
    },
    joinedCount: updatedDoc.joinedCount ?? 0,
    createdAt: updatedDoc.createdAt.toISOString(),
    updatedAt: updatedDoc.updatedAt.toISOString(),
  }
}

export async function deleteEventInDb(
  eventId: string,
  userId: string
): Promise<{ deletedEventId: string }> {
  if (!isValidObjectId(eventId)) {
    throw ApiError.badRequest("Invalid event ID")
  }

  const collection = getEventsCollection()
  const eventObjectId = new ObjectId(eventId)
  const existing = await collection.findOne({ _id: eventObjectId })

  if (!existing) {
    throw ApiError.notFound("Event not found")
  }

  if (existing.createdBy.userId !== userId) {
    throw ApiError.forbidden("You are not authorized to delete this event")
  }

  const deleteResult = await collection.deleteOne({
    _id: eventObjectId,
    "createdBy.userId": userId,
  })

  if (deleteResult.deletedCount === 0) {
    throw ApiError.notFound("Event not found or already deleted")
  }

  try {
    const joinedCollection = getJoinedEventsCollection()
    await joinedCollection.deleteMany({
      $or: [
        { eventId: eventObjectId },
        { eventId: eventId as unknown as ObjectId },
      ],
    })
  } catch (err) {
    console.error("Failed to clean up joined event records:", err)
  }

  return { deletedEventId: eventId }
}

export async function joinEventInDb(
  eventId: string,
  user: { userId: string; email?: string; name?: string }
): Promise<any> {
  if (!isValidObjectId(eventId)) {
    throw ApiError.badRequest("Invalid event ID")
  }

  const eventsCollection = getEventsCollection()
  const eventObjectId = new ObjectId(eventId)
  const eventDoc = await eventsCollection.findOne({ _id: eventObjectId })

  if (!eventDoc) {
    throw ApiError.notFound("Event not found")
  }

  if (!isStrictFutureDate(eventDoc.eventDate)) {
    throw ApiError.badRequest("This event is no longer available for joining.")
  }

  const joinedCollection = getJoinedEventsCollection()

  const existingParticipation = await joinedCollection.findOne({
    eventId: eventObjectId,
    userId: user.userId,
  })

  if (existingParticipation) {
    throw ApiError.conflict("You have already joined this event", {
      code: "ALREADY_JOINED",
    })
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

  const newDoc: JoinedEventDocument = {
    _id: new ObjectId(),
    eventId: eventObjectId,
    userId: user.userId,
    userEmail: userEmail || "volunteer@togetherwecare.org",
    userName: userName || "Community Member",
    joinedAt: new Date(),
  }

  try {
    await joinedCollection.insertOne(newDoc)
  } catch (error: any) {
    if (error?.code === 11000) {
      throw ApiError.conflict("You have already joined this event", {
        code: "ALREADY_JOINED",
      })
    }
    throw error
  }

  try {
    await eventsCollection.updateOne(
      { _id: eventObjectId },
      { $inc: { joinedCount: 1 } }
    )
  } catch {
  }

  return {
    _id: newDoc._id.toString(),
    eventId: newDoc.eventId.toString(),
    userId: newDoc.userId,
    userName: newDoc.userName,
    joinedAt: newDoc.joinedAt.toISOString(),
  }
}

export async function getJoinStatusFromDb(
  eventId: string,
  userId: string
): Promise<boolean> {
  if (!isValidObjectId(eventId)) {
    throw ApiError.badRequest("Invalid event ID")
  }

  const eventsCollection = getEventsCollection()
  const eventObjectId = new ObjectId(eventId)
  const eventDoc = await eventsCollection.findOne({ _id: eventObjectId })

  if (!eventDoc) {
    throw ApiError.notFound("Event not found")
  }

  const joinedCollection = getJoinedEventsCollection()
  const participation = await joinedCollection.findOne({
    eventId: eventObjectId,
    userId,
  })

  return Boolean(participation)
}
