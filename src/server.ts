import dotenv from "dotenv"
dotenv.config()

import app from "./app.js"

const PORT = Number(process.env.PORT) || 5000

try {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
  })
} catch (error) {
  console.error("Failed to start server:", error)
  process.exit(1)
}

