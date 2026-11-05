import { MongoClient, Db } from "mongodb"

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToDatabase(): Promise<Db> {
  if (db && client) {
    return db
  }

  const uri = process.env.MONGODB_URI
  const dbName = process.env.DB_NAME || "together_we_care"

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is missing. Please set MONGODB_URI in your .env file."
    )
  }

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    })

    await client.connect()
    db = client.db(dbName)
    await db.command({ ping: 1 })

    return db
  } catch (error) {
    client = null
    db = null
    const message = error instanceof Error ? error.message : "Unknown connection error"
    throw new Error(`Failed to connect to MongoDB database "${dbName}": ${message}`)
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error(
      "Database has not been initialized. Call connectToDatabase() before accessing the database."
    )
  }
  return db
}

export function setDb(customDb: Db | null): void {
  db = customDb
}

export function getClient(): MongoClient | null {
  return client
}

export async function isDatabaseConnected(): Promise<boolean> {
  if (!db) {
    return false
  }

  try {
    await db.command({ ping: 1 })
    return true
  } catch {
    return false
  }
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
