# 🌱 TogetherWeCare — Backend API
### Powering Communities. Connecting People. Creating Impact.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5-black?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Secure_Authentication-purple?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

![Zod](https://img.shields.io/badge/Zod-4-3E67B1?style=for-the-badge)
![Better Auth](https://img.shields.io/badge/Better_Auth-JWKS-black?style=for-the-badge)
![API](https://img.shields.io/badge/API-RESTful-16A34A?style=for-the-badge)

<br />

**A Secure, Scalable REST API for Community-Driven Social Development**

The backend infrastructure powering TogetherWeCare, a platform that enables communities to organize, discover, manage, and participate in meaningful social service initiatives.

<br />

[Client Repository](https://github.com/iRfANhAiDeRABiR/b14-A-008-client) · [Server Repository](https://github.com/iRfANhAiDeRABiR/b14-A-008-server) · [API Documentation](docs/API.md)

</div>

---

## 🌍 Project Overview

**TogetherWeCare** is a community-driven social development platform designed to connect volunteers, organizers, and communities through meaningful social service initiatives.

This repository contains the backend REST API built with Express.js, TypeScript, and MongoDB.

It handles business logic, event management, user authorization, participation tracking, data validation, and secure communication with the Next.js frontend.

From winter clothing distributions and donation campaigns to environmental cleanups, tree plantations, educational programs, and healthcare initiatives, TogetherWeCare provides the digital infrastructure needed to organize community impact.

> **Our Mission:** Small Actions. Stronger Communities. A Better Tomorrow.

---

## ✨ Key Features

### 1. 📅 Community Event Management
- Create community service events.
- Store event titles, descriptions, categories, locations, images, and dates.
- Validate event information using Zod.
- Prevent creation of events with past dates.

### 2. 🔎 Upcoming Event Discovery
- Retrieve upcoming community events.
- Search events by title, description, and location.
- Filter by event category.
- Filter by location.
- Filter by calendar date range.
- Sort events chronologically.
- Implement server-side pagination.
- Optimize database queries using MongoDB operations.

### 3. 🤝 Event Participation
- Allow authenticated users to join events.
- Prevent duplicate participation.
- Validate event availability.
- Store participation records in MongoDB.
- Use compound unique indexes for duplicate protection.

### 4. 📋 Personal Event Management
- Retrieve events created by the authenticated user.
- Update personal event information.
- Delete personal events.
- Enforce creator ownership verification.
- Clean up associated participation records when deleting events.

### 5. ❤️ Joined Event Tracking
- Retrieve events joined by the authenticated user.
- Display participation history.
- Include joining dates.
- Sort upcoming events first.
- Display completed events afterward.

### 6. 🔐 Secure Authentication & Authorization
- Better Auth JWT integration.
- Stateless JWT verification using `jose`.
- Remote JWKS public-key verification.
- Protected API endpoints.
- Server-side ownership authorization.
- Secure user identity extraction.

### 7. 🛡️ API Security
- Zod request validation.
- Helmet security headers.
- CORS origin restrictions.
- Express rate limiting.
- MongoDB injection prevention.
- Safe production error responses.
- Environment-based configuration.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Node.js 20+ | JavaScript runtime |
| Express.js 5 | Backend web framework |
| TypeScript 5 | Type-safe development |
| MongoDB 7 | Database driver |
| MongoDB Atlas | Cloud database |
| Better Auth | Authentication integration |
| jose | JWT and JWKS verification |
| Zod 4 | Request validation |
| Helmet | HTTP security headers |
| CORS | Cross-origin request management |
| express-rate-limit | API request limiting |
| dotenv | Environment configuration |
| tsx | TypeScript development execution |

---

## 🏗️ Backend Architecture

The backend follows a modular architecture separating routes, controllers, services, database configuration, validation, and middleware.

```text
TogetherWeCare Server
│
├── docs/
│   ├── API.md
│   ├── openapi.yaml
│   └── DEPLOYMENT.md
│
├── postman/
│   └── TogetherWeCare.postman_collection.json
│
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   ├── collections.ts
│   │   └── database-indexes.ts
│   │
│   ├── controllers/
│   │   └── event.controller.ts
│   │
│   ├── services/
│   │   └── event.service.ts
│   │
│   ├── routes/
│   │   └── event.routes.ts
│   │
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── global-error-handler.ts
│   │   ├── rate-limiter.ts
│   │   └── request-logger.ts
│   │
│   ├── types/
│   │   ├── event.ts
│   │   ├── joined-event.ts
│   │   └── express.d.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── api-error.ts
│   │
│   ├── validations/
│   │   └── event.validation.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*The structure above illustrates the main architectural modules; individual filenames should follow the current repository.*

---

## 🔐 Authentication & JWT Architecture

TogetherWeCare uses **Better Auth JWT** on the Next.js client and `jose` on the Express backend.

The backend verifies tokens through the client's public JWKS endpoint without sharing private signing keys.

### Authentication Flow

1. A user registers or logs in through Better Auth.
2. Better Auth generates a signed JWT.
3. The client exposes public verification keys through its JWKS endpoint.
4. The frontend sends the JWT to the Express backend.
5. Express verifies the token signature using `jose`.
6. Protected APIs process requests only after successful verification.

### Authorization Header

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### JWKS Endpoint

Local development:

```text
http://localhost:3000/api/auth/jwks
```

Production:

```text
https://your-frontend-domain.com/api/auth/jwks
```

The production domain must be replaced with the actual deployed frontend URL.

---

## 📡 API Endpoints

All API endpoints use the `/api` prefix.

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check server and database health |
| GET | `/api/events` | Retrieve upcoming events |
| GET | `/api/events/:id` | Retrieve event details |

### Protected Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/events` | Create an event |
| GET | `/api/events/my-events` | Retrieve personally created events |
| PATCH | `/api/events/:id` | Update an owned event |
| DELETE | `/api/events/:id` | Delete an owned event |
| POST | `/api/events/:id/join` | Join a community event |
| GET | `/api/events/:id/join-status` | Check participation status |
| GET | `/api/events/joined` | Retrieve joined events |

### Event Discovery Query Parameters

The upcoming events API supports:

| Parameter | Description |
|---|---|
| `search` | Search by title, description, or location |
| `eventType` | Filter by event category |
| `location` | Filter by location |
| `startDate` | Inclusive starting date |
| `endDate` | Inclusive ending date |
| `sort` | Sort by nearest or latest |
| `page` | Current page number |
| `limit` | Number of events per page |

Example:

```http
GET /api/events?search=winter&eventType=Donation&location=Dhaka&page=1&limit=9
```

Homepage request:

```http
GET /api/events?limit=6
```

---

## 🗄️ Database Design

TogetherWeCare uses MongoDB Atlas with dedicated collections.

### Events Collection

Stores community event information.

Main fields:

- `_id`
- `title`
- `description`
- `eventType`
- `imageUrl`
- `location`
- `eventDate`
- `createdBy`
- `createdAt`
- `updatedAt`

### Joined Events Collection

Stores event participation records.

Main fields:

- `_id`
- `eventId`
- `userId`
- `userEmail`
- `userName`
- `joinedAt`

### Database Optimization

A compound unique index is used for participation:

```javascript
{
  eventId: 1,
  userId: 1
}
```

This prevents the same user from joining the same event multiple times.

Additional indexes support event retrieval, date filtering, and user-specific queries.

---

## 🚀 Getting Started

Follow these instructions to run the backend locally.

### Prerequisites

Make sure you have installed:

- Node.js 20 or newer.
- npm.
- Git.
- MongoDB Atlas account.
- A running TogetherWeCare frontend for local Better Auth JWKS verification.

### 1. Clone the Repository

```bash
git clone https://github.com/iRfANhAiDeRABiR/b14-A-008-server.git
```

### 2. Navigate to the Project

```bash
cd b14-A-008-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create your local `.env` file from the example.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open `.env` and configure the actual values.

### 5. Start the Development Server

```bash
npm run dev
```

The server runs at:

```text
http://localhost:5000
```

### 6. Check TypeScript

```bash
npm run typecheck
```

### 7. Build the Application

```bash
npm run build
```

### 8. Start Production Server

```bash
npm run start
```

---

## ⚙️ Environment Variables

Configure these variables inside the server `.env` file.

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | Application environment |
| `PORT` | No | Express server port |
| `CLIENT_URL` | Yes | Frontend origin allowed by CORS |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `DB_NAME` | No | MongoDB database name |
| `BETTER_AUTH_JWKS_URL` | No | Better Auth public JWKS endpoint |
| `BETTER_AUTH_ISSUER` | No | Expected JWT issuer, if configured |
| `BETTER_AUTH_AUDIENCE` | No | Expected JWT audience, if configured |
| `TRUST_PROXY` | No | Reverse proxy trust configuration |

### Example Configuration

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:3000

MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=together_we_care

BETTER_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks

BETTER_AUTH_ISSUER=
BETTER_AUTH_AUDIENCE=

TRUST_PROXY=1
```

**Security Guidelines:**

- Never upload `.env` to GitHub.
- Never expose MongoDB credentials.
- Never expose private signing keys.
- Never share Better Auth secrets.
- Use HTTPS for production connections.
- Keep `.env.example` free from actual credentials.

---

## 🧪 API Testing

The project includes a ready-to-import Postman collection.

### Postman Collection

[Open TogetherWeCare Postman Collection](postman/TogetherWeCare.postman_collection.json)

### API Documentation

[Read Complete API Documentation](docs/API.md)

### OpenAPI Specification

[View OpenAPI 3.1 Specification](docs/openapi.yaml)

### Testing Checklist

- [ ] Health check API.
- [ ] Upcoming events API.
- [ ] Event search and filtering.
- [ ] Event details API.
- [ ] Create event with JWT.
- [ ] Retrieve personal events.
- [ ] Update event ownership validation.
- [ ] Delete event functionality.
- [ ] Join event functionality.
- [ ] Duplicate participation prevention.
- [ ] Join status API.
- [ ] Joined events API.
- [ ] Unauthorized request handling.

---

## 🛡️ Security & Performance

TogetherWeCare follows a security-focused backend architecture.

| Security Feature | Implementation |
|---|---|
| Authentication | Better Auth JWT |
| Token Verification | jose and Remote JWKS |
| Authorization | Server-side ownership verification |
| Input Validation | Zod |
| HTTP Headers | Helmet |
| Cross-Origin Protection | CORS allowlist |
| Rate Limiting | express-rate-limit |
| Database Security | Validated MongoDB queries |
| Error Handling | Centralized global error middleware |
| Duplicate Prevention | MongoDB compound unique index |

### Rate Limiting

The API uses two levels of rate limiting:

- General API requests: 300 requests per 15 minutes.
- Mutation requests: 30 requests per 15 minutes.

These limits are subject to the configured server environment.

---

## 🌐 Deployment

The backend is prepared for deployment using **Render** and MongoDB Atlas.

### Deployment Guide

[Read the Complete Render Deployment Guide](docs/DEPLOYMENT.md)

### Render Deployment Configuration

| Setting | Value |
|---|---|
| Platform | Render |
| Service Type | Web Service |
| Runtime | Node.js |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| Health Check | `/api/health` |

### Production Environment Variables

Configure the following in the Render dashboard:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=your_production_mongodb_uri
DB_NAME=together_we_care
BETTER_AUTH_JWKS_URL=https://your-frontend-domain.com/api/auth/jwks
```

Configure issuer, audience, and proxy settings according to the actual production configuration.

**Production API URL:** To be added after successful deployment.

**Health Check URL:** `https://your-api-domain.com/api/health`

Do not use the example URL until the service has actually been deployed.

---

## 🔗 Project Repositories

| Project | Repository |
|---|---|
| Frontend | [b14-A-008-client](https://github.com/iRfANhAiDeRABiR/b14-A-008-client) |
| Backend | [b14-A-008-server](https://github.com/iRfANhAiDeRABiR/b14-A-008-server) |

### Project Information

**Project:** TogetherWeCare

**Category:** Social Development & Community Event Management

**Backend:** Express.js REST API

**Database:** MongoDB Atlas

**Author:** Md. Irfan Haider

---

## 🎯 Project Objectives

TogetherWeCare aims to:

- Encourage community participation.
- Connect event organizers with volunteers.
- Promote social responsibility.
- Support local environmental initiatives.
- Make community service opportunities accessible.
- Build stronger and more connected communities.

---

<div align="center">

## 💚 TogetherWeCare

### Small Actions. Stronger Communities.

**Building technology for meaningful community impact.**

<br />

[Frontend Repository](https://github.com/iRfANhAiDeRABiR/b14-A-008-client) · [Backend Repository](https://github.com/iRfANhAiDeRABiR/b14-A-008-server)

<br />

Made with ❤️ for a better community.

© 2026 TogetherWeCare. All Rights Reserved.

</div>
