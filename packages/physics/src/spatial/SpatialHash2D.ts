function nextPow2(n: number): number {
  let p = 1;
  while (p < n) {
    p <<= 1;
  }
  return p;
}

/** Cheap integer hash for a grid cell coordinate, mixing bits so nearby cells don't
 * collide predictably. Result is masked to `[0, numBuckets)` by the caller. */
function hashCell(cx: number, cy: number): number {
  const h = (cx * 92837111) ^ (cy * 689287499);
  return h >>> 0;
}

/**
 * Uniform-grid spatial hash for 2D broadphase queries. Entities are bucketed by
 * `floor(pos / cellSize)`; `rebuild()` re-buckets every entity in one allocation-free
 * counting-sort pass, so it's safe to call once per fixed step.
 *
 * Bucket collisions (two different cells hashing to the same bucket) are possible and
 * intentional — this is a broadphase. Callers should always confirm candidates with an
 * exact narrowphase test (e.g. `circleCircleIntersect`).
 */
export class SpatialHash2D {
  readonly cellSize: number;
  readonly capacity: number;
  private readonly numBuckets: number;
  private readonly mask: number;

  private readonly bucketStart: Int32Array;
  private readonly bucketCursor: Int32Array;
  private readonly entryBucket: Int32Array;
  private readonly entries: Int32Array;

  count = 0;

  constructor(capacity: number, cellSize: number, numBuckets?: number) {
    this.capacity = capacity;
    this.cellSize = cellSize;
    this.numBuckets = nextPow2(Math.max(numBuckets ?? capacity * 2, 8));
    this.mask = this.numBuckets - 1;

    this.bucketStart = new Int32Array(this.numBuckets + 1);
    this.bucketCursor = new Int32Array(this.numBuckets);
    this.entryBucket = new Int32Array(capacity);
    this.entries = new Int32Array(capacity);
  }

  cellX(x: number): number {
    return Math.floor(x / this.cellSize);
  }

  cellY(y: number): number {
    return Math.floor(y / this.cellSize);
  }

  /** Re-buckets the first `count` entries of `x`/`y`. Zero allocation. */
  rebuild(x: Float32Array, y: Float32Array, count: number): void {
    this.count = count;
    this.bucketCursor.fill(0);

    for (let i = 0; i < count; i++) {
      const cx = this.cellX(x[i]!);
      const cy = this.cellY(y[i]!);
      const bucket = hashCell(cx, cy) & this.mask;
      this.entryBucket[i] = bucket;
      this.bucketCursor[bucket]! += 1;
    }

    this.bucketStart[0] = 0;
    for (let b = 0; b < this.numBuckets; b++) {
      this.bucketStart[b + 1] = this.bucketStart[b]! + this.bucketCursor[b]!;
    }

    for (let b = 0; b < this.numBuckets; b++) {
      this.bucketCursor[b] = this.bucketStart[b]!;
    }

    for (let i = 0; i < count; i++) {
      const bucket = this.entryBucket[i]!;
      const pos = this.bucketCursor[bucket]!;
      this.entries[pos] = i;
      this.bucketCursor[bucket] = pos + 1;
    }
  }

  /** Invokes `visit(index)` for every entry whose cell falls within `radius` of
   * `(px, py)`, scanning the covering range of grid cells. May report entries that are
   * actually further than `radius` away (broadphase); may also repeat an index if two
   * scanned cells hash to the same bucket. */
  queryRadius(px: number, py: number, radius: number, visit: (index: number) => void): void {
    const minCx = this.cellX(px - radius);
    const maxCx = this.cellX(px + radius);
    const minCy = this.cellY(py - radius);
    const maxCy = this.cellY(py + radius);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        this.queryCell(cx, cy, visit);
      }
    }
  }

  /** Invokes `visit(index)` for every entry bucketed into grid cell `(cx, cy)`
   * (subject to the same hash-collision caveats as {@link queryRadius}). */
  queryCell(cx: number, cy: number, visit: (index: number) => void): void {
    const bucket = hashCell(cx, cy) & this.mask;
    const start = this.bucketStart[bucket]!;
    const end = this.bucketStart[bucket + 1]!;
    for (let k = start; k < end; k++) {
      visit(this.entries[k]!);
    }
  }
}

/** Alias: a spatial hash *is* the uniform-grid broadphase structure for this engine. */
export const UniformGrid = SpatialHash2D;
