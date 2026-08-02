import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const chrome =
  "/tmp/cursor-sandbox-cache/bb6112585dab93f3831676ce2fe83648/playwright/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell";
const outdir = path.dirname(new URL(import.meta.url).pathname);
const port = 9359;
const pageUrl = "http://127.0.0.1:4199/moment";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (url) =>
  new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });

const proc = spawn(
  chrome,
  [
    `--remote-debugging-port=${port}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

await sleep(1000);
const ver = await getJson(`http://127.0.0.1:${port}/json/version`);
const ws = new WebSocket(ver.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const i = ++id;
    pending.set(i, { resolve, reject });
    ws.send(
      JSON.stringify(
        sessionId ? { id: i, sessionId, method, params } : { id: i, method, params },
      ),
    );
  });

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};

const { targetId } = await send("Target.createTarget", { url: pageUrl });
const { sessionId } = await send("Target.attachToTarget", {
  targetId,
  flatten: true,
});
const s = (method, params = {}) => send(method, params, sessionId);
await s("Page.enable");
await s("Runtime.enable");

let ready = false;
for (let i = 0; i < 36; i++) {
  await sleep(500);
  const r = await s("Runtime.evaluate", {
    returnByValue: true,
    expression: `({t:document.body.innerText.slice(0,180),b:[...document.querySelectorAll('button')].map(x=>x.getAttribute('aria-label')).filter(Boolean)})`,
  });
  const v = r?.result?.value ?? r?.value ?? {};
  if (i % 4 === 0) console.log("poll", i, JSON.stringify(v).slice(0, 240));
  if ((v.b || []).some((x) => x && x.includes("Algenubi"))) {
    ready = true;
    break;
  }
}
console.log("ready", ready);

async function shot(name) {
  const { data } = await s("Page.captureScreenshot", { format: "png" });
  const file = path.join(outdir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  console.log("wrote", name, fs.statSync(file).size);
}

await shot("01-stars-after-opening");
if (ready) {
  for (const name of [
    "Algenubi",
    "Rasalas",
    "Adhafera",
    "Algieba",
    "η Leonis",
    "Regulus",
    "Chertan",
    "Denebola",
    "Zosma",
  ]) {
    await s("Runtime.evaluate", {
      expression: `(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.getAttribute('aria-label')||'').startsWith(${JSON.stringify(name)})); if(b)b.click(); return!!b;})()`,
    });
    await sleep(400);
  }
  await sleep(4200);
  await shot("02-complete-new-atlas");
}

ws.close();
proc.kill();
