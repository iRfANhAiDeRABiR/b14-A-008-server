# TogetherWeCare Backend Production Deployment Guide (Render)

This guide provides step-by-step instructions for deploying the **TogetherWeCare** Express.js & TypeScript backend to [Render](https://render.com/).

---

## Prerequisites

1. **GitHub Repository**: The server repository must be pushed to GitHub:
   `https://github.com/iRfANhAiDeRABiR/b14-A-008-server`
2. **MongoDB Atlas Cluster**: A live MongoDB Atlas database with a configured database user, password, and Network Access allowing incoming traffic from Render (or `0.0.0.0/0`).
3. **Frontend Application**: The TogetherWeCare Next.js frontend deployed (e.g., on Vercel) exposing its public JWKS endpoint:
   `https://<your-deployed-frontend>.vercel.app/api/auth/jwks`
4. **Render Account**: An active account at [https://render.com/](https://render.com/).

---

## Step 1: Connect GitHub Repository to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. In the top-right corner, click **New +** and select **Web Service**.
3. Under **Connect a repository**, link your GitHub account if you haven't already.
4. Search for your server repository: **`b14-A-008-server`** (or `iRfANhAiDeRABiR/b14-A-008-server`) and click **Connect**.

---

## Step 2: Configure Web Service Settings

Fill in the basic configuration fields:

| Configuration Field | Recommended Setting |
| :--- | :--- |
| **Name** | `togetherwecare-server` (or your preferred unique service name) |
| **Region** | Choose the region closest to your users and MongoDB Atlas cluster (e.g., *Singapore*, *Frankfurt*, or *Oregon*) |
| **Branch** | `main` |
| **Root Directory** | *(Leave blank if repository root is the server folder, or set to `server` if in a monorepo)* |
| **Runtime** | `Node` |
| **Instance Type** | `Free` (or higher tier) |

---

## Step 3: Specify Build & Start Commands

Configure the exact build and runtime commands:

- **Build Command**:
  ```bash
  npm install && npm run build
  ```
  *(Or `npm ci && npm run build` if clean installation is preferred).*
- **Start Command**:
  ```bash
  npm start
  ```
  *(This executes `node dist/server.js`, running the compiled production JavaScript).*

---

## Step 4: Configure Production Environment Variables

Under the **Environment Variables** section on Render, add the following key-value pairs:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode (sanitizes error stack traces and isolates CORS). |
| `DB_NAME` | `together_we_care` | Target MongoDB database name. |
| `CLIENT_URL` | `https://your-frontend-domain.vercel.app` | URL of your deployed Next.js frontend for CORS origin approval. Multiple domains can be comma-separated. |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority` | Your live MongoDB Atlas connection string. |
| `BETTER_AUTH_JWKS_URL` | `https://your-frontend-domain.vercel.app/api/auth/jwks` | Remote JWKS endpoint exposed by Better Auth in your deployed frontend. |
| `TRUST_PROXY` | `1` | Enables trust proxy for Render reverse proxy, allowing rate limiters to identify real client IPs accurately. |

> [!IMPORTANT]
> **Do not set `PORT` on Render.** Render automatically assigns an ephemeral port via the `PORT` environment variable and routes public HTTPS traffic to it. The server code dynamically reads `process.env.PORT`.

---

## Step 5: Configure Health Check Path

1. Scroll down and expand **Advanced Settings**.
2. Locate the **Health Check Path** field.
3. Enter:
   ```text
   /api/health
   ```
4. Render will query this endpoint during zero-downtime rolling deployments to ensure MongoDB Atlas is connected and returning `HTTP 200` before routing public traffic to the new instance.

---

## Step 6: Trigger Initial Deployment

1. Click **Create Web Service**.
2. Render will clone the repository, execute `npm install && npm run build`, and launch `npm start`.
3. In the Render deployment logs, verify that the following startup messages appear:
   ```text
   MongoDB connected successfully.
   Database indexes initialized successfully.
   TogetherWeCare API started successfully.
   Environment: production.
   Server listening on http://0.0.0.0:10000
   Health check: http://0.0.0.0:10000/api/health
   ```
4. Render will provide your public service URL:
   `https://<your-service-name>.onrender.com`

---

## Step 7: Post-Deployment Verification

Verify that your live deployment is fully functional:

1. **Health Check**:
   Open `https://<your-service-name>.onrender.com/api/health` in your browser.
   Expected response:
   ```json
   {
     "success": true,
     "message": "TogetherWeCare API is running",
     "status": "healthy",
     "database": "connected"
   }
   ```
2. **Upcoming Events**:
   Open `https://<your-service-name>.onrender.com/api/events?limit=6`.
   Verify that events from MongoDB Atlas are returned.
3. **Frontend Connection**:
   Update your deployed Next.js client environment variable on Vercel:
   ```text
   NEXT_PUBLIC_API_URL=https://<your-service-name>.onrender.com
   ```
   Re-deploy the frontend and test the full end-to-end user experience (authentication, event creation, browsing, joining, and management).

