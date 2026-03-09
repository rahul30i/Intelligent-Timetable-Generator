import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma.js";
import { idSchema } from "../utils/validation.js";

export async function teacherRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/teachers", { preHandler: [app.authenticate] }, async () => {
    const teachers = await prisma.teacher.findMany();
    return { teachers };
  });

  app.post("/teachers", { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      availability: z.record(z.array(z.number().int().min(0).max(12))).optional(),
    });
    const body = schema.parse(request.body);

    const teacher = await prisma.teacher.create({ data: body });
    reply.code(201).send({ teacher });
  });

  app.put("/teachers/:id", { preHandler: [app.authenticate] }, async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    const body = z
      .object({
        name: z.string().min(1),
        email: z.string().email().optional().nullable(),
        availability: z.record(z.array(z.number().int().min(0).max(12))).optional(),
      })
      .parse(request.body);

    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: body,
    });

    return { teacher };
  });

  app.delete("/teachers/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    await prisma.teacher.delete({ where: { id: params.id } });
    reply.code(204).send();
  });
}
