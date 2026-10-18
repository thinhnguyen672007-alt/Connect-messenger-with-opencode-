import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "./app.js";
import { readConfig } from "./config.js";

test("tasks returns the matching task or a real HTTP 404", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());

  for (const expected of [
    { id: "task-001", text: "Tạo file hello.txt", status: "pending" },
    { id: "task-002", text: "Đọc cấu trúc dự án", status: "completed" },
  ]) {
    const response = await app.inject({
      method: "GET",
      url: `/tasks/${expected.id}`,
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), expected);
  }

  const missing = await app.inject({ method: "GET", url: "/tasks/task-999" });
  assert.equal(missing.statusCode, 404);
  assert.deepEqual(missing.json(), { error: "Task not found" });
});

// Kiểm tra cả vòng tạo → đọc lại, không chỉ phản hồi POST riêng lẻ.
test("creates unique tasks that can be retrieved by ID", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  const ids = new Set<string>();
  for (let i = 0; i < 2; i++) {
    const created = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { text: "  Tạo file mới  " },
    });
    assert.equal(created.statusCode, 201);
    const task = created.json<{ id: string; text: string; status: string }>();
    assert.match(task.id, /^[0-9a-f-]{36}$/);
    assert.equal(task.text, "Tạo file mới");
    assert.equal(task.status, "pending");
    assert.equal(created.headers.location, `/tasks/${task.id}`);
    ids.add(task.id);
    const found = await app.inject({ method: "GET", url: `/tasks/${task.id}` });
    assert.equal(found.statusCode, 200);
    assert.deepEqual(found.json(), task);
  }
  assert.equal(ids.size, 2);
});

// Tạo lại ứng dụng minh họa dữ liệu RAM không phải lưu trữ bền vững.
test("rejects invalid tasks and does not share task data across app instances", async (t) => {
  const app = buildApp({ logger: false });
  const otherApp = buildApp({ logger: false });
  t.after(() => app.close());
  t.after(() => otherApp.close());
  for (const payload of [
    {},
    { text: 123 },
    { text: " " },
    { text: "a".repeat(2001) },
    { text: "Hi", status: "completed" },
  ]) {
    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload,
    });
    assert.equal(response.statusCode, 400);
  }
  const created = await app.inject({
    method: "POST",
    url: "/tasks",
    payload: { text: "Task riêng" },
  });
  const task = created.json<{ id: string }>();
  const missing = await otherApp.inject({
    method: "GET",
    url: `/tasks/${task.id}`,
  });
  assert.equal(missing.statusCode, 404);
});

test("messages accepts text and trims surrounding whitespace", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  const response = await app.inject({
    method: "POST",
    url: "/messages",
    payload: { text: "  Hãy tạo file hello.txt  " },
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    reply: "Đã nhận: Hãy tạo file hello.txt",
  });
});

test("messages rejects invalid bodies instead of coercing input", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  const invalidBodies = [
    {},
    { text: 123 },
    { text: null },
    { text: "" },
    { text: " \n\t " },
    { text: "a".repeat(2001) },
    { text: "Hello", userId: "someone-else" },
  ];
  for (const payload of invalidBodies) {
    const response = await app.inject({
      method: "POST",
      url: "/messages",
      payload,
    });
    assert.equal(response.statusCode, 400, JSON.stringify(payload));
  }
});

test("messages accepts the length boundary and rejects malformed JSON", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  const boundary = await app.inject({
    method: "POST",
    url: "/messages",
    payload: { text: "a".repeat(2000) },
  });
  assert.equal(boundary.statusCode, 200);
  const malformed = await app.inject({
    method: "POST",
    url: "/messages",
    headers: { "content-type": "application/json" },
    payload: '{"text":',
  });
  assert.equal(malformed.statusCode, 400);
});

test("health endpoint and missing route", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  const health = await app.inject({ method: "GET", url: "/health" });
  assert.equal(health.statusCode, 200);
  assert.deepEqual(health.json(), { status: "ok" });
  const missing = await app.inject({ method: "GET", url: "/missing" });
  assert.equal(missing.statusCode, 404);
});

test("configuration defaults and invalid port", () => {
  assert.deepEqual(readConfig({}), { port: 3000, host: "127.0.0.1" });
  for (const port of ["abc", "0", "65536", "3000.5", ""]) {
    assert.throws(() => readConfig({ PORT: port }), /PORT/);
  }
  assert.throws(() => readConfig({ HOST: " " }), /HOST/);
});

test("internal errors do not expose their details", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  app.get("/failure", async () => {
    throw new Error("private database credential");
  });
  const response = await app.inject({ method: "GET", url: "/failure" });
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), { error: "Internal Server Error" });
});

test("oversized payload is rejected", async (t) => {
  const app = buildApp({ logger: false });
  t.after(() => app.close());
  app.post("/payload", async () => ({ status: "ok" }));
  const response = await app.inject({
    method: "POST",
    url: "/payload",
    payload: { text: "a".repeat(1024 * 1024) },
  });
  assert.equal(response.statusCode, 413);
});
