const fs = require("node:fs");
const path = require("node:path");
const winston = require("winston");

const logDir = process.env.LOG_DIR || "./logs";
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "nexus-redacao" },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error", maxsize: 5242880, maxFiles: 5 }),
    new winston.transports.File({ filename: path.join(logDir, "combined.log"), maxsize: 5242880, maxFiles: 5 })
  ]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
  }));
}

function httpLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
}

module.exports = { logger, httpLogger };
