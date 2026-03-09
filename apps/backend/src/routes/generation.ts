import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma.js";
import { idSchema } from "../utils/validation.js";
import { generateAndSaveTimetable } from "../services/timetableService.js";

export async function generationRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.post("/generation/setup", { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      classId: idSchema,
      semester: z.number().int().min(1).max(12).optional(),
    });
    const body = schema.parse(request.body);

    const setup = await prisma.generationSetup.create({
      data: {
        classId: body.classId,
        semester: body.semester ?? null,
        prioritiesVerified: true,
      },
    });

    reply.code(201).send({ setup });
  });

  app.get("/generation/setup", { preHandler: [app.authenticate] }, async (request) => {
    const query = z.object({ classId: idSchema.optional() }).parse(request.query);
    const setups = await prisma.generationSetup.findMany({
      where: query.classId ? { classId: query.classId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return { setups };
  });

  app.post("/generation/run", { preHandler: [app.authenticate] }, async (request, reply) => {
    const schema = z.object({
      classId: idSchema,
      semester: z.number().int().min(1).max(12).optional(),
    });
    const body = schema.parse(request.body);

    const timetable = await generateAndSaveTimetable(prisma, body.classId, body.semester);
    reply.code(201).send({ timetable });
  });
}
