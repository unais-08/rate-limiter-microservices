import type { LogLevel, LogMetadata } from "../types/index.js";

/**
 * Log level priorities
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.blue,
  debug: COLORS.gray,
};

/**
 * Simple production-ready logger utility
 */
class Logger {
  private readonly serviceName: string;
  private readonly level: number;

  constructor(serviceName: string, level: LogLevel = "info") {
    this.serviceName = serviceName;
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  private _log(level: LogLevel, message: string, meta: LogMetadata = {}): void {
    if (LOG_LEVELS[level] > this.level) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      service: this.serviceName,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
      // Production: JSON-only output
      const output = JSON.stringify(logEntry);
      level === "error" ? console.error(output) : console.log(output);
      return;
    }

    // Development: Colored output
    const color = LEVEL_COLORS[level];
    const coloredLevel = `${color}${logEntry.level}${COLORS.reset}`;

    const metaString =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    const output = `[${coloredLevel}] ${timestamp} ${this.serviceName}: ${message}${metaString}`;
    level === "error" ? console.error(output) : console.log(output);
  }

  error(message: string, meta?: LogMetadata): void {
    this._log("error", message, meta);
  }

  warn(message: string, meta?: LogMetadata): void {
    this._log("warn", message, meta);
  }

  info(message: string, meta?: LogMetadata): void {
    this._log("info", message, meta);
  }

  debug(message: string, meta?: LogMetadata): void {
    this._log("debug", message, meta);
  }

  // Convenience method for success messages (uses info level)
  success(message: string, meta?: LogMetadata): void {
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd) {
      // Development: Add green checkmark for visual clarity
      const timestamp = new Date().toISOString();
      const metaString =
        Object.keys(meta || {}).length > 0 ? ` ${JSON.stringify(meta)}` : "";
      console.log(
        `${COLORS.green}✓${COLORS.reset} [INFO] ${timestamp} ${this.serviceName}: ${message}${metaString}`,
      );
    } else {
      // Production: Use standard info level
      this._log("info", message, meta || {});
    }
  }
}

export default Logger;
