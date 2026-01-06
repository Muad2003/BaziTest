import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 5432,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 60000, // how long a client can remain idle
  connectionTimeoutMillis: 5000, // how long to wait for a connection
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test connection
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("✅ PostgreSQL database connected successfully")
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection failed:", err.message)
    process.exit(1)
  })

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err)
  if (err.code === "ECONNREFUSED") {
    console.error("PostgreSQL connection was refused.")
  }
  if (err.code === "ETIMEDOUT") {
    console.error("PostgreSQL connection timed out.")
  }
})

export const convertQuery = (query, params) => {
  let index = 1
  const convertedQuery = query.replace(/\?/g, () => `$${index++}`)
  return { query: convertedQuery, params }
}

export const executeQuery = async (query, params = []) => {
  const { query: convertedQuery, params: convertedParams } = convertQuery(query, params)
  return pool.query(convertedQuery, convertedParams)
}

export default pool
