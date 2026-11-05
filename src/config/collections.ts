import { Collection } from "mongodb"
import { getDb } from "./db.js"
import { EventDocument } from "../types/event.js"
import { JoinedEventDocument } from "../types/joined-event.js"

export const COLLECTIONS = {
  EVENTS: "events",
  JOINED_EVENTS: "joinedEvents",
  USER: "user",
} as const

export function getEventsCollection(): Collection<EventDocument> {
  return getDb().collection<EventDocument>(COLLECTIONS.EVENTS)
}

export function getJoinedEventsCollection(): Collection<JoinedEventDocument> {
  return getDb().collection<JoinedEventDocument>(COLLECTIONS.JOINED_EVENTS)
}

export function getCollections() {
  return {
    eventsCollection: getEventsCollection(),
    joinedEventsCollection: getJoinedEventsCollection(),
  }
}

