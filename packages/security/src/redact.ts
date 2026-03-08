import { SENSITIVE_FIELDS } from "./constants.js";

const REDACTED = "[REDACTED]";
const sensitiveSet = new Set<string>(SENSITIVE_FIELDS as unknown as string[]);

/**
 * Recursively redacts sensitive fields from an object before logging.
 * Handles nested objects and arrays.
 */
export function redactSecrets<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSecrets) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (sensitiveSet.has(key)) {
      result[key] = REDACTED;
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSecrets(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
