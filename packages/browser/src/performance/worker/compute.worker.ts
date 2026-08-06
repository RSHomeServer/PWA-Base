export interface WorkerStartMessage {
  type: "start";
  budgetMs: number;
}

export type WorkerOutMessage =
  | { type: "progress"; fraction: number }
  | {
      type: "done";
      primesFound: number;
      candidatesChecked: number;
      opsPerSec: number;
      elapsedMs: number;
    };

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<WorkerStartMessage>) => {
  const { budgetMs } = event.data;
  const start = performance.now();
  let candidate = 1;
  let primesFound = 0;
  let lastProgress = start;

  while (performance.now() - start < budgetMs) {
    candidate += 1;
    if (isPrime(candidate)) {
      primesFound += 1;
    }
    const now = performance.now();
    if (now - lastProgress > 50) {
      ctx.postMessage({
        type: "progress",
        fraction: Math.min(1, (now - start) / budgetMs),
      } satisfies WorkerOutMessage);
      lastProgress = now;
    }
  }

  const elapsedMs = performance.now() - start;
  ctx.postMessage({
    type: "done",
    primesFound,
    candidatesChecked: candidate,
    opsPerSec: candidate / (elapsedMs / 1000),
    elapsedMs,
  } satisfies WorkerOutMessage);
};
