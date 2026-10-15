import Fastify from "fastify";
import { healthRoutes } from "./routes/health.js";
import { messageRoutes } from "./routes/messages.js";
import { taskRoutes } from "./routes/tasks.js";

export function buildApp(options: { logger?: boolean } = {}) {
  const app = Fastify({
    logger: options.logger ?? true,
    bodyLimit: 1024 * 1024,
    ajv: {
      customOptions: { coerceTypes: false, removeAdditional: false },
    },
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode =
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      error.statusCode >= 400 &&
      error.statusCode < 500
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Request failed");
      return reply.code(500).send({ error: "Internal Server Error" });
    }

    return reply.code(statusCode).send({
      error: error instanceof Error ? error.message : "Bad Request",
    });
  });

  app.register(healthRoutes);
  app.register(messageRoutes);
  app.register(taskRoutes);
  return app;
}
