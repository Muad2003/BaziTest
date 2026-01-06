export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const errorLogger = (err, req, res, next) => {
  console.error("[ERROR]", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  })
  next(err)
}

export const errorResponder = (err, req, res, next) => {
  // Duplicate entry error
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      message: "Duplicate entry found",
    })
  }

  // Foreign key constraint error
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      message: "Invalid reference to another resource",
    })
  }

  // CORS error
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS policy violation",
    })
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500
  res.status(statusCode).json({
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}
