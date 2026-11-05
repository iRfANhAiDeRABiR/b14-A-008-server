import { ObjectId } from "mongodb"

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

