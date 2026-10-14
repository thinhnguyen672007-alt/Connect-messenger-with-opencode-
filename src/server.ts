import { buildApp } from "./app.js";
import { readConfig } from "./config.js";

const app = buildApp();

async function shutdown(signal: string) {
  app.log.info({ signal }, "Shutting down");
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  try {
    await app.close();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExit);
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

async function start() {
  try {
    await app.listen(readConfig());
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
