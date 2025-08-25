// middleware/error.js

// For unknown routes
const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Not Found - ${req.originalUrl}`,
  });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || "Server Error",
    // Only show stacktrace if not production
    stack: process.env.NODE_ENV === "production" ? "🍃" : err.stack,
  });
};

module.exports = { notFound, errorHandler };
