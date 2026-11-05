import { Request, Response, NextFunction } from "express"
import { ObjectId } from "mongodb"
import { verifyToken } from "../utils/jwt.js"
import { ApiError } from "../utils/api-error.js"
import { getDb } from "../config/db.js"

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return next(ApiError.unauthorized("Authorization header is missing"))
  }

  if (!authHeader.startsWith("Bearer ")) {
    return next(
      ApiError.unauthorized("Authorization token must follow the Bearer format")
    )
  }

  const token = authHeader.slice(7).trim()

  if (!token) {
    return next(ApiError.unauthorized("Authorization token is missing"))
  }

  try {
    const payload = await verifyToken(token)

    const userId = (payload.sub || payload.userId || payload.id) as string

    if (!userId) {
      return next(
        ApiError.unauthorized("Token does not contain a valid user identifier")
      )
    }

    let email = typeof payload.email === "string" ? payload.email : undefined
    let name = typeof payload.name === "string" ? payload.name : undefined

    if (!email || !name) {
      try {
        const db = getDb()
        const userCollection = db.collection("user")
        const filter = ObjectId.isValid(userId)
          ? { $or: [{ _id: new ObjectId(userId) }, { id: userId }] }
          : { id: userId }
        const userDoc = await userCollection.findOne(filter)
        if (userDoc) {
          if (!email && typeof userDoc.email === "string") {
            email = userDoc.email
          }
          if (!name && typeof userDoc.name === "string") {
            name = userDoc.name
          }
        }
      } catch {
      }
    }

    req.user = {
      userId,
      email,
      name,
      role: typeof payload.role === "string" ? payload.role : undefined,
    }

    next()
  } catch (error) {
    next(error)
  }
}

export function requireRole(requiredRole: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"))
    }

    if (req.user.role !== requiredRole) {
      return next(ApiError.forbidden("Insufficient permissions"))
    }

    next()
  }
}

