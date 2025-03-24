import config from "../config/index.js";
import log from "../utils/logger.js";

class HttpError extends Error {
  status_code;
  success = false;

  constructor(statusCode, message) {
    super(message);
    this.name = this.constructor.name;
    this.status_code = statusCode;
  }
}

class BadRequest extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

class ResourceNotFound extends HttpError {
  constructor(message) {
    super(404, message);
  }
}

class Unauthenticated extends HttpError {
  constructor(message) {
    super(401, message);
  }
}

class Unauthorised extends HttpError {
  constructor(message) {
    super(403, message);
  }
}

class Conflict extends HttpError {
  constructor(message) {
    super(409, message);
  }
}

class InvalidInput extends HttpError {
  constructor(message) {
    super(422, message);
  }
}

class Expired extends HttpError {
  constructor(message) {
    super(410, message);
  }
}

class ServerError extends HttpError {
  constructor(message) {
    super(500, message);
  }
}

const routeNotFound = (req, res, next) => {
  const message = `Route not found: ${req.originalUrl}`;
  res.status(404).json({ success: false, status: 404, message });
};

const errorHandler = (err, _req, res, _next) => {
  log.error(err);
  const success = err.success !== undefined ? err.success : false;
  const status = err.status_code || 500;
  const message = err.message || "An unexpected error occurred";
  const cleanedMessage = message.replace(/"/g, "");

  if (config.NODE_ENV === "development") {
    log.error("Error", err);
  }
  res.status(status).json({
    success,
    status,
    message: cleanedMessage,
  });
};

export {
  BadRequest,
  Conflict,
  errorHandler,
  Unauthorised,
  HttpError,
  InvalidInput,
  ResourceNotFound,
  routeNotFound,
  ServerError,
  Unauthenticated,
  Expired,
};
