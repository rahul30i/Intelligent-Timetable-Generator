import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma.js";
import { idSchema } from "../utils/validation.js";

export async function publicRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/public/timetables", async (request) => {
    const query = z
      .object({
        classId: idSchema.optional(),
      })
      .parse(request.query);

    const timetables = await prisma.timetable.findMany({
      where: {
        status: "PUBLISHED",
        classId: query.classId,
      },
      include: { entries: true, class: true },
      orderBy: { createdAt: "desc" },
    });

    return { timetables };
  });

  app.get("/public/timetables/:id", async (request) => {
    const params = z.object({ id: idSchema }).parse(request.params);
    const timetable = await prisma.timetable.findFirst({
      where: { id: params.id, status: "PUBLISHED" },
      include: { entries: true, class: true },
    });

    return { timetable: timetable ?? null };
  });
}
