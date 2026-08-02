#!/usr/bin/env node
/**
 * Background local demo server (hello-web).
 *
 *   node scripts/dev-server.mjs start
 *   node scripts/dev-server.mjs stop
 *   pnpm dev / pnpm stop
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
  openSync,
  closeSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const stateDir = join(root, ".tmp");
const pidPath = join(stateDir, "dev-server.pid");
const logPath = join(stateDir, "dev-server.log");

const FILTER = "@platform/hello-web";
const HOST = "127.0.0.1";
const PORT = 5182;
const URL = `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 60_000;
const READY_POLL_MS = 250;

const action = process.argv[2] ?? "start";

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid() {
  if (!existsSync(pidPath)) return null;
  const raw = readFileSync(pidPath, "utf8").trim();
  const pid = Number(raw);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function clearPid() {
  if (existsSync(pidPath)) unlinkSync(pidPath);
}

async function waitForReady(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://${HOST}:${PORT}/`, { redirect: "manual" });
      // Any HTTP response means Vite is listening.
      if (res.status > 0) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, READY_POLL_MS));
  }
  return false;
}

function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin */
  }
}

function stop() {
  const pid = readPid();
  if (!pid) {
    console.log("No development server is recorded as running.");
    return;
  }
  if (!isAlive(pid)) {
    clearPid();
    console.log(`Stale PID ${pid} cleared (process not running).`);
    return;
  }

  try {
    // Kill the whole process group started with detached:true.
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch (err) {
      console.error(`Failed to stop PID ${pid}:`, err.message);
      process.exit(1);
    }
  }

  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline && isAlive(pid)) {
    sleepSync(50);
  }
  if (isAlive(pid)) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        /* ignore */
      }
    }
  }

  clearPid();
  console.log(`Development server stopped (was PID ${pid}).`);
}

async function start() {
  mkdirSync(stateDir, { recursive: true });

  const existing = readPid();
  if (existing && isAlive(existing)) {
    console.log("Development server already running");
    console.log(`PID: ${existing}`);
    console.log(`Port: ${PORT}`);
    console.log(`URL: ${URL}`);
    return;
  }
  if (existing) clearPid();

  const logFd = openSync(logPath, "w");
  const child = spawn(
    "corepack",
    ["pnpm", "--filter", FILTER, "dev"],
    {
      cwd: root,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, FORCE_COLOR: "0" },
    },
  );
  closeSync(logFd);

  if (!child.pid) {
    console.error("Failed to start development server (no PID).");
    process.exit(1);
  }

  writeFileSync(pidPath, `${child.pid}\n`);
  child.unref();

  const ready = await waitForReady(READY_TIMEOUT_MS);
  if (!ready) {
    console.error(
      `Development server did not become ready on port ${PORT} within ${READY_TIMEOUT_MS / 1000}s.`,
    );
    console.error(`See log: ${logPath}`);
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      try {
        process.kill(child.pid, "SIGTERM");
      } catch {
        /* ignore */
      }
    }
    clearPid();
    process.exit(1);
  }

  console.log("Development server started");
  console.log(`PID: ${child.pid}`);
  console.log(`Port: ${PORT}`);
  console.log(`URL: ${URL}`);
}

if (action === "start") {
  await start();
} else if (action === "stop") {
  stop();
} else {
  console.error("Usage: node scripts/dev-server.mjs <start|stop>");
  process.exit(1);
}
