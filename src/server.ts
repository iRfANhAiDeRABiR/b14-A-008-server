import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"
import { connectToDatabase } from "./config/db.js"

const PORT = Number(process.env.PORT) || 5000

async function startServer() {
  try {
    await connectToDatabase()
    console.log("MongoDB connected successfully.")

    app.listen(PORT, () => {
      console.log(`TogetherWeCare API is running on port ${PORT}.`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Database connection failed"
    const sanitized = rawMessage.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    console.error("Failed to connect to MongoDB:")
    console.error(sanitized)
    console.error("Server startup aborted. Please check MONGODB_URI in your .env file.")
    process.exit(1)
  }
}

startServer()
