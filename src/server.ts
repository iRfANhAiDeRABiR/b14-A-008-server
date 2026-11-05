import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"
import { connectToDatabase } from "./config/db.js"
import { initializeDatabaseIndexes } from "./config/database-indexes.js"

const PORT = Number(process.env.PORT) || 5000

async function startServer() {
  try {
    await connectToDatabase()
    console.log("MongoDB connected successfully.")

    await initializeDatabaseIndexes()
    console.log("Database indexes initialized successfully.")

    app.listen(PORT, () => {
      console.log(`TogetherWeCare API is running on port ${PORT}.`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
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

startServer()
