import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middleware/authenticate.js";

export async function meRoute(app: FastifyInstance): Promise<void> {
  app.get("/me", { preHandler: authenticate }, async (req, reply) => {
    return reply.send({
      id: req.user.id,
      email: req.user.email,
    });
  });
}
