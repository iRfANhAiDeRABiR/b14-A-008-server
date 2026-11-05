import { getEventsCollection, getJoinedEventsCollection } from "./collections.js"

export async function initializeDatabaseIndexes(): Promise<void> {
  const eventsCollection = getEventsCollection()
  const joinedEventsCollection = getJoinedEventsCollection()

  await eventsCollection.createIndex(
    { eventDate: 1 },
    { name: "idx_events_eventDate" }
  )

  await eventsCollection.createIndex(
    { "createdBy.userId": 1, eventDate: 1 },
    { name: "idx_events_creator_date" }
  )

  await eventsCollection.createIndex(
    { eventType: 1, eventDate: 1 },
    { name: "idx_events_type_date" }
  )

  await eventsCollection.createIndex(
    { title: "text", description: "text", location: "text" },
    { name: "idx_events_text_search" }
  )

  await joinedEventsCollection.createIndex(
    { eventId: 1, userId: 1 },
    { unique: true, name: "idx_joined_event_user_unique" }
  )

  await joinedEventsCollection.createIndex(
    { userId: 1, joinedAt: -1 },
    { name: "idx_joined_user_date" }
  )
}

