import { type FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma";

export async function authRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.post("/auth/register", async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    const body = schema.parse(request.body);

    const existing = await prisma.admin.findUnique({ where: { email: body.email } });
    if (existing) {
      reply.code(409).send({ error: "Admin already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const admin = await prisma.admin.create({
      data: { email: body.email, passwordHash },
    });

    const token = app.jwt.sign({ sub: admin.id, email: admin.email });
    reply.code(201).send({ token });
  });

  app.post("/auth/login", async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    const body = schema.parse(request.body);

    const admin = await prisma.admin.findUnique({ where: { email: body.email } });
    if (!admin) {
      reply.code(401).send({ error: "Invalid credentials." });
      return;
    }

    const valid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!valid) {
      reply.code(401).send({ error: "Invalid credentials." });
      return;
    }

    const token = app.jwt.sign({ sub: admin.id, email: admin.email });
    reply.send({ token });
  });

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    return { user: request.user };
  });
}
