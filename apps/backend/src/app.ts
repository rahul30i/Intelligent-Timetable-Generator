import Fastify from "fastify";
import sensible from "@fastify/sensible";
import { ZodError } from "zod";
import { loadEnv } from "./config/env.js";
import { registerCors } from "./plugins/cors.js";
import { registerHelmet } from "./plugins/helmet.js";
import { registerRateLimit } from "./plugins/rateLimit.js";
import { registerJwt } from "./plugins/jwt.js";
import { authRoutes } from "./routes/auth.js";
import { configRoutes } from "./routes/config.js";
import { teacherRoutes } from "./routes/teachers.js";
import { classRoutes } from "./routes/classes.js";
import { subjectRoutes } from "./routes/subjects.js";
import { assignmentRoutes } from "./routes/assignments.js";
import { priorityRoutes } from "./routes/priorities.js";
import { generationRoutes } from "./routes/generation.js";
import { timetableRoutes } from "./routes/timetables.js";
import { publicRoutes } from "./routes/public.js";

export async function buildApp() {
  const env = loadEnv();
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  await app.register(sensible);
  await registerCors(app, env);
  await registerHelmet(app);
  await registerRateLimit(app);
  await registerJwt(app, env);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes, { prefix: "/api" });
  await app.register(configRoutes, { prefix: "/api" });
  await app.register(teacherRoutes, { prefix: "/api" });
  await app.register(classRoutes, { prefix: "/api" });
  await app.register(subjectRoutes, { prefix: "/api" });
  await app.register(assignmentRoutes, { prefix: "/api" });
  await app.register(priorityRoutes, { prefix: "/api" });
  await app.register(generationRoutes, { prefix: "/api" });
  await app.register(timetableRoutes, { prefix: "/api" });
  await app.register(publicRoutes, { prefix: "/api" });

  app.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({ error: `Route ${request.method} ${request.url} not found` });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({ error: "Validation error", details: error.issues });
      return;
    }

    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    const message = statusCode >= 500 ? "Internal server error" : error.message;
    request.log.error(error);
    reply.code(statusCode).send({ error: message });
  });

  return app;
}
