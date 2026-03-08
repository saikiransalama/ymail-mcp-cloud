import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { findUserByEmail, createUser } from "@ymail-mcp/db";
import { hashPassword, signToken } from "@ymail-mcp/security";
import { AppError } from "@ymail-mcp/shared-types";

const RegisterBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export async function registerRoute(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async (req, reply) => {
    const body = RegisterBody.safeParse(req.body);
    if (!body.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid registration data", body.error.errors);
    }

    const { email, password } = body.data;

    // Check if user exists
    const existing = await findUserByEmail(app.db, email);
    if (existing) {
      throw new AppError("VALIDATION_ERROR", "An account with this email already exists");
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await createUser(app.db, { email, passwordHash });

    // Sign JWT
    const token = signToken(
      { sub: user.id, email: user.email },
      app.config.JWT_SECRET,
      "24h"
    );

    req.log.info({ userId: user.id }, "User registered");

    return reply.status(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });
}
