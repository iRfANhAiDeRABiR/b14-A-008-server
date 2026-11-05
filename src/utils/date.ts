export function parseEventDate(input: string | Date): Date {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error("Invalid date object provided")
    }
    return input
  }

  if (typeof input === "string") {
    const trimmed = input.trim()
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch
      const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0))
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
    }

    const parsed = new Date(trimmed)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }

  throw new Error(`Invalid date format: ${input}. Expected YYYY-MM-DD or valid ISO date string.`)
}

