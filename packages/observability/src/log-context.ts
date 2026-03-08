import { AsyncLocalStorage } from "async_hooks";

export interface LogContext {
  requestId: string;
  userId?: string;
  toolName?: string;
  connectionId?: string;
}

export const logContextStorage = new AsyncLocalStorage<LogContext>();

export function getLogContext(): LogContext | undefined {
  return logContextStorage.getStore();
}

export function runWithLogContext<T>(
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  return logContextStorage.run(context, fn);
}
