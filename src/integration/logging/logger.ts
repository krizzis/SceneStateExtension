export interface Logger {
  debug(message: string, payload?: unknown): void;
}

export function createLogger(
  scope: string,
  isDebugEnabled: () => boolean,
): Logger {
  return {
    debug(message: string, payload?: unknown): void {
      if (!isDebugEnabled()) {
        return;
      }

      if (payload === undefined) {
        console.log(`[${scope}] ${message}`);
        return;
      }

      console.log(`[${scope}] ${message}`, payload);
    },
  };
}
