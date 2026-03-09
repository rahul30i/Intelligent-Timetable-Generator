import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma.js";
import { idSchema } from "../utils/validation.js";

export async function timetableRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/timetables", { preHandler: [app.authenticate] }, async (request) => {
    const query = z
      .object({
        classId: idSchema.optional(),
        semester: z.string().optional(),
      })
      .parse(request.query);

    const timetables = await prisma.timetable.findMany({
      where: {
        classId: query.classId,
        semester: query.semester ? Number(query.semester) : undefined,
      },
      include: { entries: true },
      orderBy: { createdAt: "desc" },
    });

    return { timetables };
  });

  app.get("/timetables/:id", { preHandler: [app.authenticate] }, async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    const timetable = await prisma.timetable.findUnique({
      where: { id: params.id },
      include: { entries: true },
    });

    if (!timetable) {
      return { timetable: null };
    }

    return { timetable };
  });

  app.put("/timetables/:id/entries", { preHandler: [app.authenticate] }, async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    const schema = z.object({
      entries: z.array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          periodIndex: z.number().int().min(0).max(12),
          subjectId: idSchema,
          teacherId: idSchema,
          startTime: z.string(),
          endTime: z.string(),
        }),
      ),
    });
    const body = schema.parse(request.body);

    await prisma.timetableEntry.deleteMany({ where: { timetableId: params.id } });

    await prisma.timetableEntry.createMany({
      data: body.entries.map((entry) => ({
        timetableId: params.id,
        dayOfWeek: entry.dayOfWeek,
        periodIndex: entry.periodIndex,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        startTime: entry.startTime,
        endTime: entry.endTime,
      })),
    });

    const updated = await prisma.timetable.findUnique({
      where: { id: params.id },
      include: { entries: true },
    });

    return { timetable: updated };
  });

  app.post("/timetables/:id/publish", { preHandler: [app.authenticate] }, async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);

    const updated = await prisma.timetable.update({
      where: { id: params.id },
      data: { status: "PUBLISHED" },
      include: { entries: true },
    });

    return { timetable: updated };
  });
}
