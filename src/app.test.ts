import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "./app.js";
import { readConfig } from "./config.js";

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
