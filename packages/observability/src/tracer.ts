/**
 * OpenTelemetry tracer setup.
 *
 * In V1, we use a no-op tracer by default. The real OTEL SDK can be initialized
 * by setting OTEL_EXPORTER_OTLP_ENDPOINT in the environment.
 *
 * This module provides a stable API surface regardless of whether OTEL is configured.
 */

export interface Span {
  setAttribute(key: string, value: string | number | boolean): this;
  setStatus(status: { code: 0 | 1 | 2; message?: string }): this;
  recordException(err: Error): this;
  end(): void;
}

export interface Tracer {
  startSpan(name: string): Span;
  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
}

class NoOpSpan implements Span {
  setAttribute() { return this; }
  setStatus() { return this; }
  recordException() { return this; }
  end() {}
}

class NoOpTracer implements Tracer {
  startSpan(_name: string): Span {
    return new NoOpSpan();
  }

  startActiveSpan<T>(_name: string, fn: (span: Span) => T): T {
    return fn(new NoOpSpan());
  }
}

const noOp = new NoOpTracer();
const tracers = new Map<string, Tracer>();

export function getTracer(name: string): Tracer {
  if (!tracers.has(name)) {
    tracers.set(name, noOp);
  }
  return tracers.get(name)!;
}

export function initTracer(_serviceName: string): void {
  // Future: initialize @opentelemetry/sdk-node here if OTEL_EXPORTER_OTLP_ENDPOINT is set
}
