import { ObjectId } from "mongodb"
import { PublicEventItem } from "./event.js"

export interface JoinedEventDocument {
  _id: ObjectId
  eventId: ObjectId
  userId: string
  userEmail: string
  userName: string
  joinedAt: Date
}

export interface CreateJoinedEventInput {
  eventId: string | ObjectId
  userId: string
  userEmail: string
  userName: string
  joinedAt?: Date
}

export interface JoinedEventResponseItem {
  _id: string
  joinedAt: string
  event: PublicEventItem
}
