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

    const output = JSON.stringify(logEntry);

    if (level === "error") {
      console.error(output);
    } else {
      console.log(output);
    }
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
}

export default Logger;
