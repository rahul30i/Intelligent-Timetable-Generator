import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma";
import { idSchema } from "../utils/validation";

export async function priorityRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/priorities", { preHandler: [app.authenticate] }, async (request) => {
    const query = z.object({ classId: idSchema }).parse(request.query);
    const priorities = await prisma.subjectPriority.findMany({
      where: { classId: query.classId },
    });
    return { priorities };
  });

  app.put("/priorities", { preHandler: [app.authenticate] }, async (request) => {
    const schema = z.object({
      classId: idSchema,
      priorities: z.array(
        z.object({
          subjectId: idSchema,
          priority: z.number().int().min(1).max(5),
        }),
      ),
    });
    const body = schema.parse(request.body);

    await prisma.subjectPriority.deleteMany({ where: { classId: body.classId } });

    if (body.priorities.length > 0) {
      await prisma.subjectPriority.createMany({
        data: body.priorities.map((item) => ({
          classId: body.classId,
          subjectId: item.subjectId,
          priority: item.priority,
        })),
      });
    }

    const priorities = await prisma.subjectPriority.findMany({
      where: { classId: body.classId },
    });

    return { priorities };
  });
}
