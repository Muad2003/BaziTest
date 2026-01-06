import express from "express"
import cors from "cors"
import { readdirSync } from "fs"
import morgan from "morgan"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
  }),
)

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
)

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later",
    })
  },
})
app.use(globalLimiter)

app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim()
      }
    })
  }
  next()
})

import db from "./lib/db.js"
app.use((req, res, next) => {
  req.pool = db
  next()
})

app.get("/", (req, res) => {
  res.json({
    message: "Restaurant API v1.0",
    status: "running",
    timestamp: new Date().toISOString(),
  })
})

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1")
    res.json({ status: "healthy", database: "connected" })
  } catch (error) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" })
  }
})

const routeFiles = readdirSync("./routes")
for (const r of routeFiles) {
  const router = await import(`./routes/${r}`)
  app.use("/api", router.default)
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

app.use((err, req, res, next) => {
  console.error("[ERROR]", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  })

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS not allowed" })
  }

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Duplicate entry found" })
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ message: "Invalid reference" })
  }

  const statusCode = err.status || err.statusCode || 500
  res.status(statusCode).json({
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})