# TogetherWeCare — Community Social Development Events Platform (Backend API)

Welcome to the **TogetherWeCare Backend API**, a secure, high-performance RESTful service built with Express.js, TypeScript, and MongoDB. The API powers the TogetherWeCare web application, enabling volunteers, civic organizers, and communities to discover, create, manage, and join grassroots social initiatives.

---

## 🌟 Key Features

- **Community Event Creation**: Authenticated users can publish community service events with category validation, location data, image URLs, and strict future-date scheduling.
- **Upcoming Event Discovery**: High-efficiency public event search supporting case-insensitive keyword lookup, category filtering, location matching, inclusive calendar date ranges (`YYYY-MM-DD`), and stable tie-breaking chronological sorting.
- **Seamless Event Participation**: Users can join upcoming initiatives with automated duplicate prevention enforced at the database level via compound unique indexing (`{ eventId: 1, userId: 1 }`).
- **Personal Event Management**: Organizers have full lifecycle control over their own events (`GET /my-events`, `PATCH /:id`, `DELETE /:id`) with strict ownership authorization and cascading deletion of participation records.
- **Joined Event Tracking**: Volunteers can view their event participation history with intelligent two-tier sorting (upcoming events nearest first, followed by completed events most recently concluded first).
- **Asymmetric JWT Security**: Verifies Next.js Better Auth tokens statelessly using `jose` remote JWKS resolution (`/api/auth/jwks`), eliminating shared secrets.
- **Defensive API Architecture**: Equipped with two-tier rate limiting (`express-rate-limit`), Helmet security headers, CORS origin whitelisting, 1MB payload limits, and sanitized production error reporting.

---

## 🛠️ Technology Stack

- **Runtime Environment**: [Node.js](https://nodejs.org/) (v20+)
- **Web Framework**: [Express.js](https://expressjs.com/) (v5)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5 with strict mode enabled)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with native [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/) (v7)
- **Authentication**: [Better Auth](https://better-auth.com/) JWT Plugin & [jose](https://github.com/panva/jose) (JWKS)
- **Schema Validation**: [Zod](https://zod.dev/) (v4)
- **Security & Utilities**: [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), and [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)

---

## 📋 Prerequisites

Before running the backend, ensure you have:
- Node.js (v20 or higher) and npm installed.
- A MongoDB database instance (MongoDB Atlas connection string).
- The TogetherWeCare client running (typically at `http://localhost:3000`) for Better Auth JWKS verification.

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/iRfANhAiDeRABiR/b14-A-008-server.git
cd b14-A-008-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Populate your `.env` with appropriate values (see [Environment Configuration](#-environment-configuration) below).

### 4. Run the Development Server
```bash
npm run dev
```
The server will start by default at `http://localhost:5000`.

### 5. Typecheck & Build
- **Typecheck without emitting code**:
  ```bash
  npm run typecheck
  ```
- **Build production JavaScript**:
  ```bash
  npm run build
  ```
- **Start production server**:
  ```bash
  npm run start
  ```

---

## ⚙️ Environment Configuration

The server expects the following environment variables in `.env`:

| Variable | Required | Default | Purpose / Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which the Express server listens. |
| `CLIENT_URL` | Yes | `http://localhost:3000` | URL of the frontend Next.js application (used for CORS origin whitelisting). |
| `MONGODB_URI` | Yes | - | MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/`). |
| `DB_NAME` | No | `together_we_care` | Target MongoDB database name. |
| `BETTER_AUTH_JWKS_URL` | No | `http://localhost:3000/api/auth/jwks` | Remote JWKS endpoint exposed by the Next.js client for JWT public key verification. |
| `BETTER_AUTH_ISSUER` | No | - | Expected JWT issuer claim (`iss`), if configured in Better Auth. |
| `BETTER_AUTH_AUDIENCE` | No | - | Expected JWT audience claim (`aud`), if configured in Better Auth. |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`). In production, error stack traces are sanitized. |

---

## 📚 API Documentation & Resources

- **[Markdown API Guide](docs/API.md)**: Comprehensive guide detailing all endpoints, authentication headers, request bodies, query parameters, and responses.
- **[OpenAPI 3.1 Specification](docs/openapi.yaml)**: Machine-readable OpenAPI 3.1 YAML schema compatible with Swagger Editor and API gateways.
- **[Postman Collection](postman/TogetherWeCare.postman_collection.json)**: Ready-to-import Postman v2.1 collection pre-configured with folders, environment variables, and test assertions.

---

## 🛡️ API Endpoints Summary

| Method | Endpoint | Authentication | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Public | Server health and database connection status |
| `GET` | `/api/events` | Public | Paginated upcoming events with search, category, location & date filters |
| `GET` | `/api/events/:id` | Public | Public details for a specific event |
| `POST` | `/api/events` | Protected (JWT) | Create a new community service event |
| `GET` | `/api/events/my-events` | Protected (JWT) | Retrieve events organized by the authenticated user |
| `PATCH` | `/api/events/:id` | Protected (JWT) | Update an event owned by the authenticated user |
| `DELETE` | `/api/events/:id` | Protected (JWT) | Delete an event owned by the authenticated user |
| `POST` | `/api/events/:id/join` | Protected (JWT) | Join an upcoming community event |
| `GET` | `/api/events/:id/join-status` | Protected (JWT) | Check participation state for the authenticated user |
| `GET` | `/api/events/joined` | Protected (JWT) | Retrieve events joined by the authenticated user |

---

## 🔗 Repository Information

- **Server Repository**: [https://github.com/iRfANhAiDeRABiR/b14-A-008-server](https://github.com/iRfANhAiDeRABiR/b14-A-008-server)
- **Client Repository**: [https://github.com/iRfANhAiDeRABiR/b14-A-008-client](https://github.com/iRfANhAiDeRABiR/b14-A-008-client)
- **Author**: Md. Irfan Haider

