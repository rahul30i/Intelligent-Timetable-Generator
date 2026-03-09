import jwt from "@fastify/jwt";
import { type FastifyInstance } from "fastify";
import { type Env } from "../config/env.js";

export async function registerJwt(app: FastifyInstance, env: Env) {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate("authenticate", async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });
}
