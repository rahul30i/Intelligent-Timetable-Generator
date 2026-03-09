import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma.js";
import { idSchema } from "../utils/validation.js";

export async function subjectRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/subjects", { preHandler: [app.authenticate] }, async () => {
    const subjects = await prisma.subject.findMany();
    return { subjects };
  });

  app.post("/subjects", { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      code: z.string().min(1).max(20).optional(),
      credits: z.number().int().min(1).max(10).default(1),
    });
    const body = schema.parse(request.body);

    const created = await prisma.subject.create({ data: body });
    reply.code(201).send({ subject: created });
  });

  app.put("/subjects/:id", { preHandler: [app.authenticate] }, async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    const body = z
      .object({
        name: z.string().min(1),
        code: z.string().min(1).max(20).optional().nullable(),
        credits: z.number().int().min(1).max(10),
      })
      .parse(request.body);

    const updated = await prisma.subject.update({ where: { id: params.id }, data: body });
    return { subject: updated };
  });

  app.delete("/subjects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    await prisma.subject.delete({ where: { id: params.id } });
    reply.code(204).send();
  });
}
