export interface PeakData {
  min: Float32Array;
  max: Float32Array;
}

/**
 * Downsamples a decoded `AudioBuffer` into `bucketCount` min/max pairs (across all
 * channels) so the static waveform can be drawn instantly without re-reading the
 * whole buffer every animation frame.
 */
export function computePeaks(buffer: AudioBuffer, bucketCount: number): PeakData {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const bucketSize = Math.max(1, Math.floor(length / bucketCount));
  const min = new Float32Array(bucketCount);
  const max = new Float32Array(bucketCount);
  const channelData: Float32Array[] = [];
  for (let c = 0; c < channels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  for (let b = 0; b < bucketCount; b++) {
    const start = b * bucketSize;
    const end = Math.min(length, start + bucketSize);
    if (end <= start) {
      min[b] = 0;
      max[b] = 0;
      continue;
    }
    let mn = 1;
    let mx = -1;
    for (let i = start; i < end; i++) {
      for (let c = 0; c < channels; c++) {
        const v = channelData[c]![i]!;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    min[b] = mn;
    max[b] = mx;
  }

  return { min, max };
}
