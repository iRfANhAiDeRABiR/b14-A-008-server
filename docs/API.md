# TogetherWeCare Backend API Documentation

Welcome to the official REST API documentation for the **TogetherWeCare** backend service. This guide provides comprehensive, beginner-friendly explanations, integration instructions, and exact request/response specifications for all endpoints.

---

## 1. Project Overview

### About TogetherWeCare
TogetherWeCare is a social development platform designed to connect volunteers, community leaders, and civic organizations. It allows users to discover meaningful community service events, organize new initiatives (such as tree plantations, cleanups, food and clothing donations, and educational drives), track personal participation, and foster grassroots collaboration.

### Role of the Express Backend
The Express.js backend serves as the core data engine and business logic layer:
- **Central Data Persistence**: Manages event documents, categorization, location filtering, and chronological scheduling in MongoDB Atlas.
- **Participation State Engine**: Tracks user event registrations in a dedicated `joinedEvents` collection, enforcing uniqueness via compound database indexes.
- **Security & Authorization**: Verifies Better Auth JSON Web Tokens (JWT) using asymmetric cryptographic signatures fetched from the Next.js client's JWKS endpoint, ensuring data integrity without storing shared private keys on the API server.
- **Resilience & Protection**: Implements two-tier rate limiting, strict Zod schema validation, regex escaping, and input bounds to guard against denial of service, injection, and unauthorized data tampering.

### Technology Stack
- **Runtime & Framework**: Node.js (v20+) with Express.js (v5)
- **Language**: TypeScript (v5 in strict mode)
- **Database**: MongoDB Atlas with native MongoDB Node.js Driver (v7)
- **Authentication**: Better Auth JWT Plugin with `jose` JWKS verification
- **Validation**: Zod (v4)
- **Security Middleware**: Helmet, CORS, and Express Rate Limit

---

## 2. Base URL & Environments

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:5000` | Default local Express server instance |
| **Production** | `https://your-api-domain.com` | Production deployment host (e.g., Render, Railway, or VPS) |

All API endpoints are prefixed with `/api`.

---

## 3. Authentication & JWT Architecture

TogetherWeCare uses an asymmetric **JSON Web Key Set (JWKS)** architecture powered by Better Auth:
1. **Token Issuance**: When a user registers or logs in via the Next.js frontend (Email/Password or GitHub OAuth), Better Auth issues a signed JWT using its internal asymmetric private key.
2. **JWKS Exposure**: The Next.js frontend exposes its public keys at `http://localhost:3000/api/auth/jwks`.
3. **Stateless Verification**: The Express backend fetches and caches these public keys using `createRemoteJWKSet` from `jose`.
4. **Header Format**: For every protected endpoint, the frontend sends the token in the `Authorization` header:
   ```http
   Authorization: Bearer <your_jwt_token>
   ```
5. **Fail-Closed Security**: If the token is missing, expired, malformed, or signed by an untrusted key, Express immediately returns `HTTP 401 Unauthorized`.

### How the Frontend Obtains the JWT
- **Client-Side (React Components / Browser)**:
  ```typescript
  import { authClient } from "@/lib/auth-client"

  export async function getTokenFromClient(): Promise<string | undefined> {
    const { data } = await authClient.token()
    return data?.token
  }
  ```
- **Server-Side (Next.js Server Components / Actions)**:
  ```typescript
  import { headers } from "next/headers"
  import { auth } from "@/lib/auth"

  export async function getTokenFromServer(): Promise<string | undefined> {
    const session = await auth.api.getToken({
      headers: await headers(),
    })
    return session?.token
  }
  ```

---

## 4. Endpoints Inventory

| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | None | Server and database health monitoring |
| `GET` | `/api/events` | Public | General (300/15m) | Discover upcoming events with search, filters & pagination |
| `GET` | `/api/events/:id` | Public | General (300/15m) | Retrieve full public details of a single event |
| `POST` | `/api/events` | Protected | Mutation (30/15m) | Create a new community service event |
| `GET` | `/api/events/my-events` | Protected | General (300/15m) | Retrieve events organized by the authenticated user |
| `PATCH` | `/api/events/:id` | Protected | Mutation (30/15m) | Update an event owned by the authenticated user |
| `DELETE` | `/api/events/:id` | Protected | Mutation (30/15m) | Delete an event owned by the authenticated user |
| `POST` | `/api/events/:id/join` | Protected | Mutation (30/15m) | Join an upcoming community event |
| `GET` | `/api/events/:id/join-status` | Protected | General (300/15m) | Check if the authenticated user has joined an event |
| `GET` | `/api/events/joined` | Protected | General (300/15m) | Retrieve events joined by the user (2-tier sorting) |

---

## 5. Detailed Endpoint Specifications

### 5.1. Health Check
Checks connectivity to MongoDB and verifies API availability.

- **URL**: `/api/health`
- **Method**: `GET`
- **Authentication**: Public (No JWT required)

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "TogetherWeCare API is running",
  "status": "healthy",
  "database": "connected"
}
```

#### Service Unavailable (`HTTP 503 Service Unavailable`)
```json
{
  "success": false,
  "message": "TogetherWeCare API is running but database is disconnected",
  "status": "unhealthy",
  "database": "disconnected"
}
```

---

### 5.2. Discover Upcoming Events
Retrieves paginated, upcoming community service events with optional text search, category filtering, location matching, and calendar date-range filtering.

- **URL**: `/api/events`
- **Method**: `GET`
- **Authentication**: Public

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Page number (must be positive integer) |
| `limit` | `integer` | No | `6` | Events per page (1 to 50) |
| `search` | `string` | No | - | Case-insensitive substring match in title, description, location |
| `eventType` | `string` | No | - | Category filter (`Cleanup`, `Plantation`, `Donation`, `Education`, `Healthcare`, `Other`, or `all`) |
| `location` | `string` | No | - | Case-insensitive partial location match |
| `startDate`| `string` | No | - | `YYYY-MM-DD` calendar start date (inclusive) |
| `endDate` | `string` | No | - | `YYYY-MM-DD` calendar end date (inclusive) |
| `sort` | `string` | No | `nearest` | Chronological sort: `nearest` (ascending) or `latest` (descending) |

#### Example Requests
- **Homepage Query (Maximum 6 records)**:
  `GET /api/events?limit=6`
- **Events Directory (Page 1, 9 records)**:
  `GET /api/events?page=1&limit=9`
- **Search and Filter**:
  `GET /api/events?search=winter&eventType=Donation&location=Dhaka&sort=nearest`
- **Date Range Query**:
  `GET /api/events?startDate=2026-12-01&endDate=2026-12-31`

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Upcoming events retrieved successfully",
  "events": [
    {
      "_id": "6729a1b2c3d4e5f6a7b8c9d0",
      "title": "Winter Warmth Clothing Drive",
      "description": "Collecting warm coats and thermal blankets for families during winter.",
      "eventType": "Donation",
      "imageUrl": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      "location": "Dhaka Community Center",
      "eventDate": "2026-12-15T10:00:00.000Z",
      "createdBy": {
        "name": "Sarah Jenkins"
      },
      "joinedCount": 12,
      "createdAt": "2026-11-01T08:00:00.000Z",
      "updatedAt": "2026-11-01T08:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalEvents": 12,
    "limit": 6
  },
  "data": {
    "events": [ /* same array */ ],
    "pagination": { /* same object */ }
  }
}
```

#### Error Responses
- `HTTP 400 Bad Request`: Invalid dates, invalid date range (`startDate > endDate`), invalid page/limit numbers, or unsupported event categories.

---

### 5.3. Get Event Details
Retrieves complete public information for a single event by its 24-character hexadecimal MongoDB ObjectId.

- **URL**: `/api/events/:id`
- **Method**: `GET`
- **Authentication**: Public

#### URL Parameters
- `id`: Valid 24-character hexadecimal MongoDB `ObjectId`.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Event details retrieved successfully",
  "data": {
    "event": {
      "_id": "6729a1b2c3d4e5f6a7b8c9d0",
      "title": "Winter Warmth Clothing Drive",
      "description": "Collecting warm coats and thermal blankets for families during winter.",
      "eventType": "Donation",
      "imageUrl": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c",
      "location": "Dhaka Community Center",
      "eventDate": "2026-12-15T10:00:00.000Z",
      "createdBy": {
        "name": "Sarah Jenkins"
      },
      "joinedCount": 12,
      "createdAt": "2026-11-01T08:00:00.000Z",
      "updatedAt": "2026-11-01T08:00:00.000Z"
    }
  }
}
```

#### Error Responses
- `HTTP 400 Bad Request`: `Invalid event ID` (not a 24-hex string).
- `HTTP 404 Not Found`: `Event not found`.

---

### 5.4. Create Community Event
Creates a new community service event. The creator's `userId`, `email`, and `name` are securely bound from the verified JWT payload.

- **URL**: `/api/events`
- **Method**: `POST`
- **Authentication**: Required (`Bearer <JWT>`)

#### Request Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "title": "North Zone River Clean-Up Drive",
  "description": "Join our volunteer team to remove plastic and waste along the river embankment.",
  "eventType": "Cleanup",
  "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
  "location": "Buriganga North Bank, Dhaka",
  "eventDate": "2026-12-20"
}
```

#### Validation Rules
- `title`: String, 5 to 100 characters.
- `description`: String, 20 to 2000 characters.
- `eventType`: One of `Cleanup`, `Plantation`, `Donation`, `Education`, `Healthcare`, `Other`.
- `imageUrl`: Valid HTTP/HTTPS image URL.
- `location`: String, 3 to 150 characters.
- `eventDate`: String in `YYYY-MM-DD` or ISO format, strictly in the future (from tomorrow onwards).
- Strict validation: Unrecognized fields (such as `_id`, `joinedCount`, `createdBy`) are rejected.

#### Success Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "event": {
      "_id": "6729e8888888888888888888",
      "title": "North Zone River Clean-Up Drive",
      "description": "Join our volunteer team to remove plastic and waste along the river embankment.",
      "eventType": "Cleanup",
      "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
      "location": "Buriganga North Bank, Dhaka",
      "eventDate": "2026-12-20T00:00:00.000Z",
      "createdBy": {
        "userId": "6729user1111111111111111",
        "email": "sarah.organizer@domain.com",
        "name": "Sarah Jenkins"
      },
      "joinedCount": 0,
      "createdAt": "2026-11-05T12:00:00.000Z",
      "updatedAt": "2026-11-05T12:00:00.000Z"
    }
  }
}
```

---

### 5.5. Manage My Events
Retrieves all events organized by the currently authenticated user.

- **URL**: `/api/events/my-events`
- **Method**: `GET`
- **Authentication**: Required (`Bearer <JWT>`)

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "My events retrieved successfully",
  "events": [
    {
      "_id": "6729e8888888888888888888",
      "title": "North Zone River Clean-Up Drive",
      "description": "Join our volunteer team to remove plastic and waste along the river embankment.",
      "eventType": "Cleanup",
      "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
      "location": "Buriganga North Bank, Dhaka",
      "eventDate": "2026-12-20T00:00:00.000Z",
      "createdBy": {
        "userId": "6729user1111111111111111",
        "email": "sarah.organizer@domain.com",
        "name": "Sarah Jenkins"
      },
      "joinedCount": 3,
      "createdAt": "2026-11-05T12:00:00.000Z",
      "updatedAt": "2026-11-05T12:00:00.000Z"
    }
  ],
  "data": {
    "events": [ /* same array */ ]
  }
}
```

---

### 5.6. Update Event
Updates editable fields of an event. Only the user who created the event can perform this operation.

- **URL**: `/api/events/:id`
- **Method**: `PATCH`
- **Authentication**: Required (`Bearer <JWT>`)

#### Request Body
At least one field must be supplied:
```json
{
  "title": "North Zone River Clean-Up Drive (Rescheduled)",
  "location": "Buriganga Central Ghat, Dhaka"
}
```

#### Security & Ownership Rules
- Verifies that `existing.createdBy.userId === authenticatedUserId`.
- Unrecognized or protected fields (e.g., `createdBy`, `userId`, `_id`, `joinedCount`) return `HTTP 400 Bad Request`.
- Attempting to update another user's event returns `HTTP 403 Forbidden`.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": {
      "_id": "6729e8888888888888888888",
      "title": "North Zone River Clean-Up Drive (Rescheduled)",
      "description": "Join our volunteer team to remove plastic and waste along the river embankment.",
      "eventType": "Cleanup",
      "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
      "location": "Buriganga Central Ghat, Dhaka",
      "eventDate": "2026-12-20T00:00:00.000Z",
      "createdBy": {
        "userId": "6729user1111111111111111",
        "email": "sarah.organizer@domain.com",
        "name": "Sarah Jenkins"
      },
      "joinedCount": 3,
      "createdAt": "2026-11-05T12:00:00.000Z",
      "updatedAt": "2026-11-05T12:45:00.000Z"
    }
  }
}
```

---

### 5.7. Delete Event
Deletes an event created by the authenticated user, automatically cascading deletion across associated registration records in `joinedEvents`.

- **URL**: `/api/events/:id`
- **Method**: `DELETE`
- **Authentication**: Required (`Bearer <JWT>`)

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": {
    "deletedEventId": "6729e8888888888888888888"
  }
}
```

#### Error Responses
- `HTTP 403 Forbidden`: `You are not authorized to delete this event`.
- `HTTP 404 Not Found`: `Event not found`.

---

### 5.8. Join Community Event
Registers the authenticated user for an upcoming event with duplicate prevention.

- **URL**: `/api/events/:id/join`
- **Method**: `POST`
- **Authentication**: Required (`Bearer <JWT>`)

#### Business & Concurrency Rules
- The event must exist and must be in the future.
- Uses MongoDB compound unique index `{ eventId: 1, userId: 1 }` to prevent race conditions and duplicate joins.
- Increments `joinedCount` on the event document by 1.

#### Success Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Successfully joined the event",
  "data": {
    "participation": {
      "_id": "6729f1111111111111111111",
      "eventId": "6729e8888888888888888888",
      "userId": "6729user1111111111111111",
      "userName": "Sarah Jenkins",
      "joinedAt": "2026-11-05T13:00:00.000Z"
    }
  }
}
```

#### Conflict Response (`HTTP 409 Conflict`)
```json
{
  "success": false,
  "message": "You have already joined this event",
  "code": "ALREADY_JOINED",
  "error": {
    "code": "ALREADY_JOINED"
  }
}
```

---

### 5.9. Check Join Status
Checks whether the authenticated user has already joined a specific event. Used by the Event Details page to render the proper button state after refreshing.

- **URL**: `/api/events/:id/join-status`
- **Method**: `GET`
- **Authentication**: Required (`Bearer <JWT>`)

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "data": {
    "hasJoined": true
  }
}
```

---

### 5.10. Get Joined Events
Retrieves all events joined by the authenticated user with two-tier chronological sorting.

- **URL**: `/api/events/joined`
- **Method**: `GET`
- **Authentication**: Required (`Bearer <JWT>`)

#### Two-Tier Sorting Rule
1. **Upcoming Events (`eventDate >= today`)**: Sorted ascending by `eventDate` (nearest upcoming event first).
2. **Completed Events (`eventDate < today`)**: Sorted descending by `eventDate` (most recently completed event first).
3. Both organizer email and participant email are stripped from the response for privacy.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Joined events retrieved successfully",
  "joinedEvents": [
    {
      "_id": "6729f1111111111111111111",
      "joinedAt": "2026-11-05T13:00:00.000Z",
      "event": {
        "_id": "6729e8888888888888888888",
        "title": "North Zone River Clean-Up Drive",
        "description": "Join our volunteer team to remove plastic and waste along the river embankment.",
        "eventType": "Cleanup",
        "imageUrl": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
        "location": "Buriganga Central Ghat, Dhaka",
        "eventDate": "2026-12-20T00:00:00.000Z",
        "createdBy": {
          "name": "Sarah Jenkins"
        },
        "joinedCount": 4,
        "createdAt": "2026-11-05T12:00:00.000Z",
        "updatedAt": "2026-11-05T12:45:00.000Z"
      }
    }
  ],
  "data": {
    "joinedEvents": [ /* same array */ ]
  }
}
```

---

## 6. Standard Error Response Structure

All error responses from the API follow a standardized JSON format:

```json
{
  "success": false,
  "message": "Human-readable explanation of the error",
  "error": null
}
```

| HTTP Status | Meaning | Typical Trigger |
| :--- | :--- | :--- |
| `400 Bad Request` | Validation Failure | Invalid ObjectId, invalid date format, invalid pagination parameters, or empty update |
| `401 Unauthorized`| Authentication Failure | Missing Bearer token, invalid token signature, or expired JWT |
| `403 Forbidden` | Authorization Failure | Authenticated user is not the organizer of the event |
| `404 Not Found` | Resource Missing | Event ID does not exist in the database |
| `409 Conflict` | State Conflict | User has already joined this event (`ALREADY_JOINED`) |
| `413 Payload Too Large` | Oversized Request | Request body exceeds 1MB limit |
| `429 Too Many Requests` | Rate Limit Exceeded | Client exceeded 300 general requests or 30 mutations in 15 minutes |
| `500 Internal Error` | Server Exception | Unhandled error (sanitized in production) |
| `503 Unavailable` | Dependency Down | MongoDB Atlas connection pool unreachable |

