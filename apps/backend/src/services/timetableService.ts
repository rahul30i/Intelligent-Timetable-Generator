import { type PrismaClient } from "@prisma/client";
import { generateWithGeneticAlgorithm } from "./gaEngine";

export async function generateAndSaveTimetable(
  prisma: PrismaClient,
  classId: string,
  semester?: number,
) {
  const generated = await generateWithGeneticAlgorithm(prisma, classId, semester);

  const timetable = await prisma.timetable.create({
    data: {
      classId,
      semester: semester ?? null,
      status: "DRAFT",
      entries: {
        create: generated.entries.map((entry) => ({
          dayOfWeek: entry.dayOfWeek,
          periodIndex: entry.periodIndex,
          subjectId: entry.subjectId,
          teacherId: entry.teacherId,
          startTime: entry.startTime,
          endTime: entry.endTime,
        })),
      },
    },
    include: {
      entries: true,
    },
  });

  return timetable;
}
