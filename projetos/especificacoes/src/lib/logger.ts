const isDev = import.meta.env.DEV;

export const logger = {
  error(message?: unknown, ...args: unknown[]) {
    if (isDev) {
      console.error(message, ...args);
    }
  },
  warn(message?: unknown, ...args: unknown[]) {
    if (isDev) {
      console.warn(message, ...args);
    }
  },
  info(message?: unknown, ...args: unknown[]) {
    if (isDev) {
      console.info(message, ...args);
    }
  },
  log(message?: unknown, ...args: unknown[]) {
    if (isDev) {
      console.log(message, ...args);
    }
  },
};
