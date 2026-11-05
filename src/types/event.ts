import { ObjectId } from "mongodb"

export type EventType =
  | "Cleanup"
  | "Plantation"
  | "Donation"
  | "Education"
  | "Healthcare"
  | "Other"

export interface EventCreator {
  userId: string
  email: string
  name: string
}

export interface EventDocument {
  _id: ObjectId
  title: string
  description: string
  eventType: EventType
  imageUrl: string
  location: string
  eventDate: Date
  createdBy: EventCreator
  joinedCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateEventInput {
  title: string
  description: string
  eventType: EventType
  imageUrl: string
  location: string
  eventDate: string | Date
}

export interface UpdateEventInput {
  title?: string
  description?: string
  eventType?: EventType
  imageUrl?: string
  location?: string
  eventDate?: string | Date
}

