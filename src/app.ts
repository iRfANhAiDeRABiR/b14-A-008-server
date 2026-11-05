import express, { Express, Request, Response } from "express"
import cors from "cors"
import healthRouter from "./routes/health.route.js"

const app: Express = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/health", healthRouter)

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "TogetherWeCare Server is running",
  })
})

export { app }
export default app

