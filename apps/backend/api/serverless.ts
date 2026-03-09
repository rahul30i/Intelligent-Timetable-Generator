type AppInstance = {
  ready: () => Promise<void>;
  server: { emit: (event: string, req: unknown, res: unknown) => void };
};

let appPromise: Promise<AppInstance> | null = null;

async function getApp(): Promise<AppInstance> {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildApp } = await import("../dist/app.js");
      const app = await buildApp();
      await app.ready();
      return app;
    })();
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    app.server.emit("request", req, res);
  } catch (error) {
    console.error("Backend function bootstrap failed", error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: "Backend startup failed",
          hint: "Check backend env vars: JWT_SECRET, DATABASE_URL, CORS_ORIGIN.",
        }),
      );
    }
  }
}
