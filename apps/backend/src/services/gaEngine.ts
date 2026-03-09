import { type PrismaClient } from "@prisma/client";
import { addMinutes, formatTime, parseTime } from "../utils/time";

export type GeneratedEntry = {
  dayOfWeek: number;
  periodIndex: number;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
};

type Slot = {
  dayOfWeek: number;
  periodIndex: number;
  startTime: string;
  endTime: string;
};

function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildSlots(
  startTime: string,
  lectureDurationMinutes: number,
  lecturesPerDay: number,
  breaks: Array<{ startTime: string; endTime: string }>,
  daysPerWeek = 5,
): Slot[] {
  const slots: Slot[] = [];
  const breakRanges = breaks
    .map((br) => ({ start: parseTime(br.startTime), end: parseTime(br.endTime) }))
    .sort((a, b) => a.start - b.start);

  for (let day = 0; day < daysPerWeek; day += 1) {
    let cursor = parseTime(startTime);
    let periodIndex = 0;

    while (periodIndex < lecturesPerDay) {
      const currentBreak = breakRanges.find((br) => cursor >= br.start && cursor < br.end);
      if (currentBreak) {
        cursor = currentBreak.end;
        continue;
      }

      const nextBreak = breakRanges.find(
        (br) => cursor < br.start && cursor + lectureDurationMinutes > br.start,
      );
      if (nextBreak) {
        cursor = nextBreak.end;
        continue;
      }

      const start = cursor;
      const end = addMinutes(cursor, lectureDurationMinutes);
      slots.push({
        dayOfWeek: day,
        periodIndex,
        startTime: formatTime(start),
        endTime: formatTime(end),
      });
      cursor = end;
      periodIndex += 1;
    }
  }

  return slots;
}

type Candidate = {
  assignments: number[];
  fitness: number;
};

function fitnessScore(
  candidate: number[],
  assignments: { subjectId: string; teacherId: string; availability: unknown }[],
  slots: Slot[],
): number {
  let score = 1000;

  const dailySubjectMap: Record<string, Set<number>> = {};

  candidate.forEach((assignmentIndex, idx) => {
    const assignment = assignments[assignmentIndex];
    if (!assignment) {
      score -= 50;
      return;
    }

    const slot = slots[idx];
    const key = `${slot.dayOfWeek}-${assignment.subjectId}`;
    if (!dailySubjectMap[key]) {
      dailySubjectMap[key] = new Set();
    }
    if (dailySubjectMap[key].has(slot.periodIndex)) {
      score -= 5;
    } else {
      dailySubjectMap[key].add(slot.periodIndex);
    }

    if (assignment.availability && typeof assignment.availability === "object") {
      const availability = assignment.availability as Record<string, number[]>;
      const allowed = availability[slot.dayOfWeek.toString()];
      if (Array.isArray(allowed) && !allowed.includes(slot.periodIndex)) {
        score -= 10;
      }
    }
  });

  return score;
}

function selectParent(population: Candidate[]): Candidate {
  const contenders = shuffle(population).slice(0, 3);
  return contenders.reduce((best, current) => (current.fitness > best.fitness ? current : best));
}

function crossover(parentA: Candidate, parentB: Candidate): number[] {
  const point = Math.floor(Math.random() * parentA.assignments.length);
  return parentA.assignments.slice(0, point).concat(parentB.assignments.slice(point));
}

function mutate(candidate: number[], mutationRate: number) {
  if (Math.random() < mutationRate) {
    const i = Math.floor(Math.random() * candidate.length);
    const j = Math.floor(Math.random() * candidate.length);
    [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
  }
}

export async function generateWithGeneticAlgorithm(
  prisma: PrismaClient,
  classId: string,
  semester?: number,
) {
  const config = await prisma.globalConfig.findFirst();
  if (!config) {
    throw new Error("Global configuration is required before generation.");
  }

  const breaks = await prisma.breakTime.findMany({
    where: { configId: config.id },
  });

  const assignments = await prisma.subjectAssignment.findMany({
    where: { classId },
    include: {
      subject: true,
      teacher: true,
    },
  });

  if (assignments.length === 0) {
    throw new Error("No subject assignments found for the selected class.");
  }

  const slots = buildSlots(
    config.schoolStartTime,
    config.lectureDurationMinutes,
    config.lecturesPerDay,
    breaks,
  );

  const required: number[] = [];
  assignments.forEach((assignment, idx) => {
    const creditCount = assignment.credits ?? assignment.subject.credits;
    for (let i = 0; i < creditCount; i += 1) {
      required.push(idx);
    }
  });

  if (required.length > slots.length) {
    throw new Error("Total subject credits exceed available lecture slots.");
  }

  while (required.length < slots.length) {
    required.push(Math.floor(Math.random() * assignments.length));
  }

  const populationSize = 40;
  let population: Candidate[] = Array.from({ length: populationSize }, () => {
    const genome = shuffle(required);
    return {
      assignments: genome,
      fitness: fitnessScore(
        genome,
        assignments.map((a) => ({
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          availability: a.teacher.availability,
        })),
        slots,
      ),
    };
  });

  let best = population[0];

  for (let generation = 0; generation < 120; generation += 1) {
    population = population.map((candidate) => ({
      ...candidate,
      fitness: fitnessScore(
        candidate.assignments,
        assignments.map((a) => ({
          subjectId: a.subjectId,
          teacherId: a.teacherId,
          availability: a.teacher.availability,
        })),
        slots,
      ),
    }));

    population.sort((a, b) => b.fitness - a.fitness);
    if (population[0].fitness > best.fitness) {
      best = population[0];
    }

    if (best.fitness >= 990) {
      break;
    }

    const nextGen: Candidate[] = population.slice(0, 6);

    while (nextGen.length < populationSize) {
      const parentA = selectParent(population);
      const parentB = selectParent(population);
      const child = crossover(parentA, parentB);
      mutate(child, 0.15);
      nextGen.push({
        assignments: child,
        fitness: fitnessScore(
          child,
          assignments.map((a) => ({
            subjectId: a.subjectId,
            teacherId: a.teacherId,
            availability: a.teacher.availability,
          })),
          slots,
        ),
      });
    }

    population = nextGen;
  }

  const generatedEntries: GeneratedEntry[] = best.assignments.map((assignmentIndex, idx) => {
    const assignment = assignments[assignmentIndex];
    const slot = slots[idx];
    return {
      dayOfWeek: slot.dayOfWeek,
      periodIndex: slot.periodIndex,
      subjectId: assignment.subjectId,
      teacherId: assignment.teacherId,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  });

  return {
    entries: generatedEntries,
    config,
    semester,
  };
}
