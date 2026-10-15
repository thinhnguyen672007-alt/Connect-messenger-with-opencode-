import type { FastifyInstance } from "fastify";

// Dữ liệu giả để luyện route; chưa liên kết với POST /messages hoặc OpenCode.
const tasks = [
  { id: "task-001", status: "pending" },
  { id: "task-002", status: "completed" },
];

export async function taskRoutes(app: FastifyInstance) {
  app.get<{ Params: { taskId: string } }>(
    "/tasks/:taskId",
    async (request, reply) => {
      const taskId = request.params.taskId;
      const task = tasks.find((item) => item.id === taskId);

      if (!task) {
        return reply.code(404).send({ error: "Task not found" });
      }

      return task;
    },
  );
}
