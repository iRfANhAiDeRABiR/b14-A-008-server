import { z } from "zod"
import { ObjectId } from "mongodb"
import { parseEventDate } from "../utils/date.js"

export const EVENT_CATEGORIES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Education",
  "Healthcare",
  "Other",
] as const

export function isValidCalendarDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false
  }
  const [y, m, d] = str.split("-").map(Number)
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false
  }
  const dateObj = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
  return (
    dateObj.getUTCFullYear() === y &&
    dateObj.getUTCMonth() === m - 1 &&
    dateObj.getUTCDate() === d
  )
}

export function isValidObjectId(id: unknown): id is string {
  if (typeof id !== "string") {
    return false
  }
  const trimmed = id.trim()
  if (trimmed.length !== 24) {
    return false
  }
  if (!/^[0-9a-fA-F]{24}$/.test(trimmed)) {
    return false
  }
  return ObjectId.isValid(trimmed)
}

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

export const getUpcomingEventsQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .refine((val) => val === undefined || (/^\d+$/.test(val) && Number(val) > 0), {
        message: "Page must be a positive integer",
      })
      .transform((val) => (val ? Number(val) : 1)),
    limit: z
      .string()
      .optional()
      .refine(
        (val) =>
          val === undefined ||
          (/^\d+$/.test(val) && Number(val) >= 1 && Number(val) <= 50),
        {
          message: "Limit must be a positive integer between 1 and 50",
        }
      )
      .transform((val) => (val ? Number(val) : 6)),
    search: z.string().trim().max(100, "Search query cannot exceed 100 characters").optional(),
    eventType: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) =>
          !val ||
          val === "all" ||
          EVENT_CATEGORIES.includes(val as (typeof EVENT_CATEGORIES)[number]),
        "Invalid event category. Allowed categories: Cleanup, Plantation, Donation, Education, Healthcare, Other"
      ),
    location: z.string().trim().max(100, "Location query cannot exceed 100 characters").optional(),
    startDate: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || isValidCalendarDateString(val),
        "startDate must be a valid calendar date in YYYY-MM-DD format"
      ),
    endDate: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || isValidCalendarDateString(val),
        "endDate must be a valid calendar date in YYYY-MM-DD format"
      ),
    sort: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || val === "nearest" || val === "latest",
        "Invalid sort option. Allowed values: nearest, latest"
      )
      .transform((val) => (val === "latest" ? "latest" : "nearest")),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate
      }
      return true
    },
    {
      message: "startDate cannot be later than endDate",
      path: ["startDate"],
    }
  )

export type GetUpcomingEventsQueryParams = z.infer<typeof getUpcomingEventsQuerySchema>

export const updateEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Event title must be at least 5 characters long")
      .max(100, "Event title cannot exceed 100 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .min(20, "Event description must be at least 20 characters long")
      .max(2000, "Event description cannot exceed 2000 characters")
      .optional(),
    eventType: z
      .string()
      .trim()
      .refine(
        (val) => EVENT_CATEGORIES.includes(val as (typeof EVENT_CATEGORIES)[number]),
        "Invalid event type"
      )
      .optional(),
    imageUrl: z
      .string()
      .trim()
      .url("Please enter a valid image URL")
      .refine(
        (url) => /^https?:\/\//i.test(url),
        "Image URL must use http or https protocol"
      )
      .optional(),
    location: z
      .string()
      .trim()
      .min(3, "Location must be at least 3 characters long")
      .max(150, "Location cannot exceed 150 characters")
      .optional(),
    eventDate: z
      .string()
      .trim()
      .refine((val) => {
        try {
          const parsed = parseEventDate(val)
          return isStrictFutureDate(parsed)
        } catch {
          return false
        }
      }, "Event date must be a valid future date (starting from tomorrow)")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update"
  )

export type UpdateEventSchemaType = z.infer<typeof updateEventSchema>
