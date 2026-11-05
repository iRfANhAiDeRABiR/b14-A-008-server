import { z } from "zod"
import { parseEventDate } from "../utils/date.js"

export const EVENT_CATEGORIES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Education",
  "Healthcare",
  "Other",
] as const

export function isStrictFutureDate(date: Date): boolean {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return false
  }

  const now = new Date()
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  )
  const eventUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
  )

  return eventUtc > todayUtc
}

export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Event title is required")
      .min(5, "Event title must be at least 5 characters long")
      .max(100, "Event title cannot exceed 100 characters"),
    description: z
      .string()
      .trim()
      .min(1, "Event description is required")
      .min(20, "Event description must be at least 20 characters long")
      .max(2000, "Event description cannot exceed 2000 characters"),
    eventType: z
      .string()
      .min(1, "Event type is required")
      .refine(
        (val) => EVENT_CATEGORIES.includes(val as (typeof EVENT_CATEGORIES)[number]),
        "Invalid event type"
      ),
    imageUrl: z
      .string()
      .trim()
      .min(1, "Thumbnail image URL is required")
      .url("Please enter a valid image URL")
      .refine(
        (url) => /^https?:\/\//i.test(url),
        "Image URL must use http or https protocol"
      ),
    location: z
      .string()
      .trim()
      .min(1, "Event location is required")
      .min(3, "Location must be at least 3 characters long")
      .max(150, "Location cannot exceed 150 characters"),
    eventDate: z
      .string()
      .trim()
      .min(1, "Event date is required")
      .refine((val) => {
        try {
          const parsed = parseEventDate(val)
          return isStrictFutureDate(parsed)
        } catch {
          return false
        }
      }, "Event date must be a valid future date (starting from tomorrow)"),
  })
  .strict()

export type CreateEventSchemaType = z.infer<typeof createEventSchema>
