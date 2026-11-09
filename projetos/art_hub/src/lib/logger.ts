type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  route?: string;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function createLogEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogPayload {
  return {
    level,
    message,
    data,
    timestamp: formatTimestamp(),
    route: typeof window !== "undefined" ? window.location.pathname : "server",
  };
}

function safeStringify(data?: Record<string, unknown>): string {
  try {
    return JSON.stringify(data, Object.getOwnPropertyNames(data ?? {}));
  } catch {
    return "[unserializable]";
  }
}

function sendToMonitor(payload: LogPayload): void {
  if (typeof window === "undefined") return;
  if (payload.level === "error") {
    window.__lovableEvents?.captureException?.(
      payload.data?.error ?? payload.message,
      { source: "logger", route: payload.route, ...payload.data },
      { mechanism: "manual", handled: true, severity: "error" },
    );
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      const entry = createLogEntry("debug", message, data);
      console.debug(`[${entry.timestamp}] [DEBUG] ${message}`, data ?? "");
    }
  },

  info(message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry("info", message, data);
    console.info(`[${entry.timestamp}] [INFO] ${message}`, data ?? "");
  },

  warn(message: string, data?: Record<string, unknown>) {
    const entry = createLogEntry("warn", message, data);
    console.warn(`[${entry.timestamp}] [WARN] ${message}`, data ?? "");
    sendToMonitor(entry);
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    const entry = createLogEntry("error", message, {
      ...data,
      error: error instanceof Error
        ? { message: error.message, name: error.name, stack: error.stack }
        : String(error ?? "unknown"),
    });
    console.error(`[${entry.timestamp}] [ERROR] ${message}`, safeStringify(entry.data));
    sendToMonitor(entry);
  },
};