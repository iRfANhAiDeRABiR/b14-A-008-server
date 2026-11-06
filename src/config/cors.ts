import cors, { CorsOptions } from "cors"

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
        .map((o) => o.trim().replace(/\/+$/, ""))
        .filter(Boolean)
    : []

  const devOrigins =
    process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://127.0.0.1:3000"]

  return Array.from(new Set([...devOrigins, ...envOrigins]))
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = origin.replace(/\/+$/, "")
    const allowed = getAllowedOrigins()
    if (allowed.includes(normalizedOrigin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}

export const corsMiddleware = cors(corsOptions)

