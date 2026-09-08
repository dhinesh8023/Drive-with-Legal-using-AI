const { error } = require("../utils/apiResponse");

/** 404 handler — placed after all routes. */
function notFound(req, res, next) {
  error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

/** Centralized error handler — placed last in the middleware chain. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.stack || err.message);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return error(res, 400, "Validation failed.", messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return error(res, 409, `Duplicate value for field: ${field}`);
  }

  if (err.name === "CastError") {
    return error(res, 400, `Invalid identifier: ${err.value}`);
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  return error(
    res,
    statusCode,
    err.message || "Internal server error.",
    process.env.NODE_ENV === "development" ? [err.stack] : []
  );
}

module.exports = { notFound, errorHandler };
