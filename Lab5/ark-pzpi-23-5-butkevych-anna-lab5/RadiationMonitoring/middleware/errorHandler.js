const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} = require("sequelize");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (
    err.name === "SequelizeUniqueConstraintError" ||
    err instanceof UniqueConstraintError
  ) {
    return res.status(409).json({
      error: "Duplicate entry",
      details: err.errors.map((e) => `${e.path} already exists`),
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => e.message),
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      error: "Reference error",
      message: "Referenced record does not exist",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

module.exports = errorHandler;
