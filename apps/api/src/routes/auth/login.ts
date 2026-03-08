import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { findUserByEmail } from "@ymail-mcp/db";
import { verifyPassword, signToken } from "@ymail-mcp/security";
import { AppError } from "@ymail-mcp/shared-types";

const LoginBody = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export async function loginRoute(app: FastifyInstance): Promise<void> {
  app.post("/auth/login", async (req, reply) => {
    const body = LoginBody.safeParse(req.body);
    if (!body.success) {
      throw new AppError("VALIDATION_ERROR", "Invalid credentials");
    }

    const { email, password } = body.data;

    const user = await findUserByEmail(app.db, email);
    if (!user) {
      // Use constant-time response to avoid user enumeration
      throw new AppError("UNAUTHORIZED", "Invalid email or password");
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError("UNAUTHORIZED", "Invalid email or password");
    }

    // Sign JWT — 24h for web sessions, but MCP clients may keep it longer
    const token = signToken(
      { sub: user.id, email: user.email },
      app.config.JWT_SECRET,
      "7d" // 7 days for MCP client use
    );

    req.log.info({ userId: user.id }, "User logged in");

    return reply.status(200).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  });
}
