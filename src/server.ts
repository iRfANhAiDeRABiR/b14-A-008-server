import dotenv from "dotenv"
dotenv.config()

import http from "node:http"
import app from "./app.js"
import { connectToDatabase, closeDatabase } from "./config/db.js"
import { initializeDatabaseIndexes } from "./config/database-indexes.js"

const PORT = Number(process.env.PORT) || 5000
const HOST = process.env.HOST || "0.0.0.0"
const NODE_ENV = process.env.NODE_ENV || "development"

let server: http.Server | null = null
let isShuttingDown = false

async function startServer() {
  try {
    await connectToDatabase()
    console.log("MongoDB connected successfully.")

    await initializeDatabaseIndexes()
    console.log("Database indexes initialized successfully.")

    server = app.listen(PORT, HOST, () => {
      console.log("TogetherWeCare API started successfully.")
      console.log(`Environment: ${NODE_ENV}.`)
      console.log(`Server listening on http://${HOST}:${PORT}`)
      console.log(`Health check: http://${HOST}:${PORT}/api/health`)
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Database initialization failed"
    const sanitized = rawMessage.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    console.error("Failed to initialize database:")
    console.error(sanitized)
    console.error("Server startup aborted. Please check MONGODB_URI in your .env file.")
    process.exit(1)
  }
}

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    return
  }
  isShuttingDown = true
  console.log(`Received ${signal}. Initiating graceful shutdown...`)

  if (server) {
    server.close(async (err) => {
      if (err) {
        console.error("Error closing HTTP server:", err.message)
      } else {
        console.log("HTTP server closed. No longer accepting new requests.")
      }

      try {
        await closeDatabase()
        console.log("MongoDB connection closed gracefully.")
        process.exit(0)
      } catch (dbErr: any) {
        console.error("Error during database disconnect:", dbErr.message)
        process.exit(1)
      }
    })

    setTimeout(() => {
      console.error("Shutdown timed out. Forcing termination.")
      process.exit(1)
    }, 10000).unref()
  } else {
    try {
      await closeDatabase()
      process.exit(0)
    } catch {
      process.exit(1)
    }
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

startServer()
