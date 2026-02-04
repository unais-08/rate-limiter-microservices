/**
 * Logger utility for consistent logging
 */

const logLevels = {
  ERROR: "❌",
  WARN: "⚠️",
  INFO: "ℹ️",
  SUCCESS: "✅",
  DEBUG: "🔍",
};

class Logger {
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = logLevels[level] || "ℹ️";

    console.log(`${prefix} [${timestamp}] ${message}`);

    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message, data = null) {
    this.log("ERROR", message, data);
  }

  warn(message, data = null) {
    this.log("WARN", message, data);
  }

  info(message, data = null) {
    this.log("INFO", message, data);
  }

  success(message, data = null) {
    this.log("SUCCESS", message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === "development") {
      this.log("DEBUG", message, data);
    }
  }
}

export default new Logger();
