// Native Olivelas Error Telemetry (self-hosted, zero external dependencies)
type ErrorPayload = {
  message: string;
  stack?: string;
  Source?: string;
};

let installed = false;

export const reportLovableError = (
  error: unknown,
  options?: { boundary?: string; extra?: Record<string, unknown> },
) => {
  try {
    const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));
    const payload: ErrorPayload = {
      message: err.message || "Unknown runtime error",
      stack: err.stack,
      Source: options?.boundary ?? "runtime",
    };
    console.warn("[Olivelas Telemetry]", payload);
  } catch {
    // ignore
  }
};

export const installLovableErrorReporting = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;
};
