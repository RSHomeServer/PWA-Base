export { detectBrowserIdentity } from "./detect/browserDetect.js";
export type { BrowserIdentity } from "./detect/browserDetect.js";

export {
  getWebglInfo,
  resetWebglInfoCache,
  getWasmInfo,
  isWebgpuAvailable,
} from "./graphics/webgl.js";
export type { WebglInfo, WasmInfo } from "./graphics/webgl.js";

export {
  runIndexedDbBenchmark,
  runLocalStorageProbe,
  getStorageEstimate,
  isStoragePersisted,
  requestPersistentStorage,
} from "./storage/storage.js";
export type {
  IndexedDbBenchmarkResult,
  LocalStorageProbeResult,
  StorageEstimate,
} from "./storage/storage.js";

export {
  readConnectionInfo,
  getConnection,
  pingOnce,
  lookupPublicIp,
  probeWebsocket,
} from "./network/net.js";
export type {
  NetworkConnectionInfo,
  PublicIpResult,
  WebSocketProbeResult,
} from "./network/net.js";
export { useNetworkConnection } from "./network/useNetworkConnection.js";

export { snapshotDisplayInfo, useDisplayInfo } from "./display/useDisplayInfo.js";
export type { DisplayInfo } from "./display/useDisplayInfo.js";
export {
  nearestCommonRefreshRate,
  useRefreshRate,
} from "./display/useRefreshRate.js";
export type { RefreshRateState } from "./display/useRefreshRate.js";

export { readSystemInfo, useSystemInfo } from "./system/useSystemInfo.js";
export type { SystemInfo } from "./system/useSystemInfo.js";

export { readTouchSupport, readGamepadIds, probeAudioContext } from "./input/inputProbes.js";
export type { TouchSupportInfo, AudioContextProbeResult } from "./input/inputProbes.js";

export { nextFrame } from "./performance/frame.js";
export { runCpuBenchmark } from "./performance/cpuBenchmark.js";
export { runCanvas2dBenchmark } from "./performance/canvas2dBenchmark.js";
export { runAnimationFpsBenchmark } from "./performance/animationFpsBenchmark.js";
export {
  DEFAULT_DOM_CELL_CLASS,
  runDomMutateBenchmark,
} from "./performance/domMutateBenchmark.js";
export { runSvgStressBenchmark } from "./performance/svgStressBenchmark.js";
export {
  BUDGET_MS as WORKER_BENCHMARK_BUDGET_MS,
  MAX_VISUAL_CORES,
  createComputeWorkers,
  isWorkerSupported,
  resolveWorkerCoreCount,
  runWorkerBenchmark,
} from "./performance/workerBenchmark.js";
export type { WorkerBenchmarkProgress } from "./performance/workerBenchmark.js";
export type { WorkerOutMessage, WorkerStartMessage } from "./performance/worker/compute.worker.js";

export { useBenchmark } from "./hooks/useBenchmark.js";
export type {
  BenchmarkResult,
  BenchmarkRunContext,
  BenchmarkRunner,
  BenchmarkStatus,
  UseBenchmarkState,
} from "./hooks/useBenchmark.js";
export { useBenchmarkHistory } from "./hooks/useBenchmarkHistory.js";
export type {
  BenchmarkHistory,
  HistoryEntry,
  RecordOutcome,
} from "./hooks/useBenchmarkHistory.js";
export { fpsHealth, useLiveFrameTelemetry } from "./hooks/useLiveFrameTelemetry.js";

export {
  clamp,
  formatBytes,
  formatHz,
  formatMs,
  formatNumber,
  lerp,
  percent,
} from "./format.js";

export { verdictFromThresholds } from "./verdict.js";
export type { Verdict } from "./verdict.js";
