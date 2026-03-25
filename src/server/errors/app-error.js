class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

class ValidationError extends AppError {
  constructor(message, code = "VALIDATION_ERROR") {
    super(message, 400, code);
  }
}

class NotFoundError extends AppError {
  constructor(message, code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

class ConflictError extends AppError {
  constructor(message, code = "CONFLICT") {
    super(message, 409, code);
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error.", code = "INTERNAL_ERROR") {
    super(message, 500, code);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
};
