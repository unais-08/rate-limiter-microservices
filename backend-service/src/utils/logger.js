/**
 * Simple production-ready logger utility
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor(serviceName, level = "info") {
    this.serviceName = serviceName;
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  _log(level, message, meta = {}) {
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

  error(message, meta) {
    this._log("error", message, meta);
  }

  warn(message, meta) {
    this._log("warn", message, meta);
  }

  info(message, meta) {
    this._log("info", message, meta);
  }

  debug(message, meta) {
    this._log("debug", message, meta);
  }
}

export default Logger;
