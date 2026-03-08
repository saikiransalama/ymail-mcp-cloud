import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isAppError, HTTP_STATUS_MAP } from "@ymail-mcp/shared-types";
import { ZodError } from "zod";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: FastifyError | Error, req: FastifyRequest, reply: FastifyReply) => {
      // AppError — structured, known errors
      if (isAppError(error)) {
        req.log.warn(
          { code: error.code, statusCode: error.statusCode },
          error.message
        );
        return reply.status(error.statusCode).send(error.toJSON());
      }

      // Zod validation errors
      if (error instanceof ZodError) {
        return reply.status(422).send({
          error: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        });
      }

      // Fastify validation errors
      if ("statusCode" in error && error.statusCode === 400) {
        return reply.status(400).send({
          error: "VALIDATION_ERROR",
          message: error.message,
        });
      }

      // Unexpected errors — log fully, return generic message
      req.log.error({ err: error }, "Unhandled error");
      return reply.status(500).send({
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  );
}
