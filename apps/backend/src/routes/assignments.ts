import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma.js";
import { idSchema } from "../utils/validation.js";

export async function assignmentRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/assignments", { preHandler: [app.authenticate] }, async (request) => {
    const query = z.object({ classId: idSchema.optional() }).parse(request.query);
    const assignments = await prisma.subjectAssignment.findMany({
      where: query.classId ? { classId: query.classId } : undefined,
      include: { subject: true, teacher: true, class: true },
    });
    return { assignments };
  });

  app.post("/assignments", { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      classId: idSchema,
      subjectId: idSchema,
      teacherId: idSchema,
      credits: z.number().int().min(1).max(10).optional(),
    });
    const body = schema.parse(request.body);

    const created = await prisma.subjectAssignment.create({ data: body });
    reply.code(201).send({ assignment: created });
  });

  app.delete("/assignments/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    await prisma.subjectAssignment.delete({ where: { id: params.id } });
    reply.code(204).send();
  });
}
