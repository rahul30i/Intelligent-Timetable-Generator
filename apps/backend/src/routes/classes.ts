import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma";
import { idSchema } from "../utils/validation";

export async function classRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/classes", { preHandler: [app.authenticate] }, async () => {
    const classes = await prisma.class.findMany();
    return { classes };
  });

  app.post("/classes", { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      semester: z.number().int().min(1).max(12).optional(),
    });
    const body = schema.parse(request.body);

    const created = await prisma.class.create({ data: body });
    reply.code(201).send({ class: created });
  });

  app.put("/classes/:id", { preHandler: [app.authenticate] }, async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    const body = z
      .object({
        name: z.string().min(1),
        semester: z.number().int().min(1).max(12).optional().nullable(),
      })
      .parse(request.body);

    const updated = await prisma.class.update({ where: { id: params.id }, data: body });
    return { class: updated };
  });

  app.delete("/classes/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    await prisma.class.delete({ where: { id: params.id } });
    reply.code(204).send();
  });
}
