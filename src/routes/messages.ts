import type { FastifyInstance } from "fastify";

interface MessageBody {
  text: string;
}

export async function messageRoutes(app: FastifyInstance) {
  app.post<{ Body: MessageBody }>(
    "/messages",
    {
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
    async (request) => {
      return { reply: `Đã nhận: ${request.body.text.trim()}` };
    },
  );
}
