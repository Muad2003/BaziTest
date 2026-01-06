import mysql from "mysql2/promise"
import dotenv from "dotenv"
dotenv.config()

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: "utf8mb4",
})

pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Database connected successfully")
    connection.release()
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message)
    process.exit(1)
  })

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err)
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.error("Database connection was closed.")
  }
  if (err.code === "ER_CON_COUNT_ERROR") {
    console.error("Database has too many connections.")
  }
  if (err.code === "ECONNREFUSED") {
    console.error("Database connection was refused.")
  }
})

export default pool
