#!/usr/bin/env node
/**
 * Build a production nginx image for a sibling PWA that depends on
 * `@songara/pwa-base` via `file:../PWA-Base`.
 *
 * Uses the parent directory of PWA-Base as the Docker build context (Option A)
 * and installs a temporary scoped `.dockerignore` so other siblings under
 * e.g. ~/projects are not sent to the daemon.
 *
 * Usage (from anywhere):
 *   node path/to/PWA-Base/scripts/docker-build-consumer.mjs \
 *     --app-dir Recipe-PWA \
 *     -t recipe-pwa:local
 *
 * When run from inside an application checkout that lists file:../PWA-Base,
 * --app-dir defaults to that checkout's directory name.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pwaBaseRoot = path.resolve(scriptDir, "..");
const defaultPwaBaseDirName = path.basename(pwaBaseRoot);
const siblingParent = path.dirname(pwaBaseRoot);
const dockerfile = path.join(pwaBaseRoot, "docker", "consumer-spa.Dockerfile");
const ignoreTemplate = path.join(
  pwaBaseRoot,
  "docker",
  "sibling-context.dockerignore",
);

function usage(exitCode = 0) {
  const msg = `Usage: docker-build-consumer.mjs --app-dir <dir> -t <image:tag> [options]

Options:
  --app-dir <name>              Application directory name under the sibling parent
  --pwa-base-dir <name>         Foundation directory name (default: ${defaultPwaBaseDirName})
  -t, --tag <image:tag>         Image tag (required)
  --nginx-conf <path>           Path relative to build context (default: <pwa-base>/docker/nginx-spa.conf)
  --platform-runtime-mode <m>   Default: production
  --platform-app-version <v>    Optional PLATFORM_APP_VERSION build-arg
  --build-cmd <shell>           Override image build command (default: npm run build)
  --context <path>              Override sibling parent (default: parent of this PWA-Base)
  -h, --help                    Show help
`;
  if (exitCode === 0) console.log(msg);
  else console.error(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {
    appDir: null,
    pwaBaseDir: defaultPwaBaseDirName,
    tag: null,
    nginxConf: null,
    platformRuntimeMode: "production",
    platformAppVersion: "",
    buildCmd: "npm run build",
    context: siblingParent,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v == null || v.startsWith("-")) {
        console.error(`Missing value for ${arg}`);
        usage(1);
      }
      return v;
    };
    switch (arg) {
      case "-h":
      case "--help":
        usage(0);
        break;
      case "--app-dir":
        out.appDir = next();
        break;
      case "--pwa-base-dir":
        out.pwaBaseDir = next();
        break;
      case "-t":
      case "--tag":
        out.tag = next();
        break;
      case "--nginx-conf":
        out.nginxConf = next();
        break;
      case "--platform-runtime-mode":
        out.platformRuntimeMode = next();
        break;
      case "--platform-app-version":
        out.platformAppVersion = next();
        break;
      case "--build-cmd":
        out.buildCmd = next();
        break;
      case "--context":
        out.context = path.resolve(next());
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        usage(1);
    }
  }
  return out;
}

function detectAppDirFromCwd() {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (!existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    const dep =
      pkg.dependencies?.["@songara/pwa-base"] ||
      pkg.devDependencies?.["@songara/pwa-base"];
    if (typeof dep === "string" && dep.startsWith("file:../")) {
      return path.basename(process.cwd());
    }
  } catch {
    return null;
  }
  return null;
}

function renderIgnorefile(template, appDir, pwaBaseDir) {
  return template
    .replaceAll("__APP_DIR__", appDir)
    .replaceAll("__PWA_BASE_DIR__", pwaBaseDir);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.appDir) opts.appDir = detectAppDirFromCwd();
  if (!opts.appDir) {
    console.error("Missing --app-dir (could not infer from cwd package.json).");
    usage(1);
  }
  if (!opts.tag) {
    console.error("Missing -t / --tag.");
    usage(1);
  }

  // Prefer an app-shipped nginx overlay when present (e.g. FPL /fpl-api).
  const appOverlay = path.join(
    opts.context,
    opts.appDir,
    "docker",
    "nginx-spa-fpl.conf",
  );
  const nginxConf =
    opts.nginxConf ||
    (existsSync(appOverlay)
      ? path.posix.join(opts.appDir, "docker/nginx-spa-fpl.conf")
      : path.posix.join(opts.pwaBaseDir, "docker/nginx-spa.conf"));

  const appPath = path.join(opts.context, opts.appDir);
  const basePath = path.join(opts.context, opts.pwaBaseDir);
  if (!existsSync(appPath)) {
    console.error(`Application directory not found: ${appPath}`);
    process.exit(1);
  }
  if (!existsSync(basePath)) {
    console.error(`PWA-Base directory not found: ${basePath}`);
    process.exit(1);
  }
  if (!existsSync(dockerfile)) {
    console.error(`Dockerfile not found: ${dockerfile}`);
    process.exit(1);
  }
  if (!existsSync(ignoreTemplate)) {
    console.error(`Ignore template not found: ${ignoreTemplate}`);
    process.exit(1);
  }

  const template = readFileSync(ignoreTemplate, "utf8");
  const ignoreBody = renderIgnorefile(template, opts.appDir, opts.pwaBaseDir);
  const parentIgnore = path.join(opts.context, ".dockerignore");
  const backupPath = path.join(
    mkdtempSync(path.join(tmpdir(), "pwa-docker-ignore-")),
    ".dockerignore.backup",
  );
  let hadExisting = false;
  if (existsSync(parentIgnore)) {
    hadExisting = true;
    renameSync(parentIgnore, backupPath);
  }

  const restoreIgnore = () => {
    try {
      if (existsSync(parentIgnore)) rmSync(parentIgnore);
      if (hadExisting) renameSync(backupPath, parentIgnore);
    } catch (err) {
      console.error("Failed to restore parent .dockerignore:", err);
    }
  };

  process.on("exit", restoreIgnore);
  process.on("SIGINT", () => {
    restoreIgnore();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    restoreIgnore();
    process.exit(143);
  });

  writeFileSync(parentIgnore, ignoreBody, "utf8");

  const dockerfileRel = path.relative(opts.context, dockerfile);
  const args = [
    "build",
    "-f",
    dockerfileRel,
    "-t",
    opts.tag,
    "--build-arg",
    `APP_DIR=${opts.appDir}`,
    "--build-arg",
    `PWA_BASE_DIR=${opts.pwaBaseDir}`,
    "--build-arg",
    `NGINX_CONF=${nginxConf}`,
    "--build-arg",
    `PLATFORM_RUNTIME_MODE=${opts.platformRuntimeMode}`,
    "--build-arg",
    `PLATFORM_APP_VERSION=${opts.platformAppVersion}`,
    `--build-arg=APP_BUILD_CMD=${opts.buildCmd}`,
    ".",
  ];

  console.log(`Build context: ${opts.context}`);
  console.log(`Dockerfile:    ${dockerfileRel}`);
  console.log(`APP_DIR:       ${opts.appDir}`);
  console.log(`NGINX_CONF:    ${nginxConf}`);
  console.log(`Image:         ${opts.tag}`);
  console.log(`Running: docker ${args.join(" ")}`);

  const result = spawnSync("docker", args, {
    cwd: opts.context,
    stdio: "inherit",
    env: process.env,
  });

  restoreIgnore();
  process.exit(result.status ?? 1);
}

main();
