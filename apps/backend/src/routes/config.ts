import { type FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../plugins/prisma";
import { timeSchema } from "../utils/validation";

export async function configRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.get("/config/global", { preHandler: [app.authenticate] }, async () => {
    const config = await prisma.globalConfig.findFirst({
      include: { breaks: true },
    });
    return { config };
  });

  app.put("/config/global", { preHandler: [app.authenticate] }, async (request) => {
    const schema = z.object({
      schoolStartTime: timeSchema,
      lectureDurationMinutes: z.number().int().min(15).max(240),
      lecturesPerDay: z.number().int().min(1).max(12),
      breaks: z
        .array(
          z.object({
            startTime: timeSchema,
            endTime: timeSchema,
            label: z.string().max(100).optional(),
          }),
        )
        .default([]),
    });

    const body: z.infer<typeof schema> = schema.parse(request.body);

    const existing = await prisma.globalConfig.findFirst();
    const config = await prisma.globalConfig.upsert({
      where: { id: existing?.id ?? "global" },
      update: {
        schoolStartTime: body.schoolStartTime,
        lectureDurationMinutes: body.lectureDurationMinutes,
        lecturesPerDay: body.lecturesPerDay,
      },
      create: {
        id: "global",
        schoolStartTime: body.schoolStartTime,
        lectureDurationMinutes: body.lectureDurationMinutes,
        lecturesPerDay: body.lecturesPerDay,
      },
    });

    await prisma.breakTime.deleteMany({ where: { configId: config.id } });

    if (body.breaks.length > 0) {
      await prisma.breakTime.createMany({
        data: body.breaks.map((br) => ({
          configId: config.id,
          startTime: br.startTime,
          endTime: br.endTime,
          label: br.label ?? null,
        })),
      });
    }

    const updated = await prisma.globalConfig.findFirst({ include: { breaks: true } });
    return { config: updated };
  });
}
