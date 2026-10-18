import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

// Kiểu dữ liệu chung cho task mẫu và task được tạo từ request.
interface Task {
  id: string;
  text: string;
  status: "pending" | "completed";
}

export async function taskRoutes(app: FastifyInstance) {
  // Mỗi ứng dụng có dữ liệu riêng trong RAM; restart sẽ mất task mới tạo.
  const tasks: Task[] = [
    { id: "task-001", text: "Tạo file hello.txt", status: "pending" },
    { id: "task-002", text: "Đọc cấu trúc dự án", status: "completed" },
  ];

  app.get<{ Params: { taskId: string } }>(
    "/tasks/:taskId",
    async (request, reply) => {
      // GET lấy mã từ URL rồi tìm task tương ứng trong danh sách.
      const task = tasks.find((item) => item.id === request.params.taskId);
      if (!task) {
        return reply.code(404).send({ error: "Task not found" });
      }
      return task;
    },
  );

  app.post<{ Body: { text: string } }>(
    "/tasks",
    {
      // Kiểm tra JSON thật lúc nhận request, trước khi chạy hàm xử lý.
      schema: {
        body: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: {
            text: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
              pattern: "\\S",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const task: Task = {
        // POST tạo mã mới; route này không có :taskId trên URL.
        id: randomUUID(),
        text: request.body.text.trim(),
        status: "pending",
      };

      // Lưu vào RAM để GET /tasks/:taskId có thể tìm lại.
      tasks.push(task);

      // 201 báo đã tạo task, không có nghĩa agent đã thực hiện yêu cầu.
      return reply.code(201).header("Location", `/tasks/${task.id}`).send(task);
    },
  );
}
