import winston from "winston";

const { combine, timestamp, errors, printf, colorize } = winston.format;


const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} [${level}]: ${message}\n${stack}`
    : `${timestamp} [${level}]: ${message}`;
});


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    consoleFormat
  ),
  defaultMeta: { service: "loan-management-api" },
  transports: [new winston.transports.Console()],
});

export { logger };
