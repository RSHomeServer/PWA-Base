/** Minimal Standard MIDI File Type 0 writer + note-on/off parser (best-effort). */

export interface MidiNote {
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
  track: number;
}

function writeVarLen(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  for (;;) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function writeUint32(n: number): number[] {
  return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function writeUint16(n: number): number[] {
  return [(n >> 8) & 0xff, n & 0xff];
}

/** Writes a Type-0 SMF with all notes on channel 0. `ticksPerBeat` defaults to 480. */
export function writeMidiType0(notes: MidiNote[], bpm = 120, ticksPerBeat = 480): Uint8Array {
  const events: { tick: number; bytes: number[] }[] = [];
  const usecPerBeat = Math.round(60_000_000 / bpm);
  events.push({
    tick: 0,
    bytes: [
      0xff,
      0x51,
      0x03,
      (usecPerBeat >> 16) & 0xff,
      (usecPerBeat >> 8) & 0xff,
      usecPerBeat & 0xff,
    ],
  });

  for (const note of notes) {
    const startTick = Math.max(0, Math.round(note.start * ticksPerBeat));
    const endTick = Math.max(
      startTick + 1,
      Math.round((note.start + note.duration) * ticksPerBeat),
    );
    const vel = Math.max(1, Math.min(127, Math.round(note.velocity * 127)));
    const pitch = Math.max(0, Math.min(127, note.pitch));
    events.push({ tick: startTick, bytes: [0x90, pitch, vel] });
    events.push({ tick: endTick, bytes: [0x80, pitch, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || a.bytes[0]! - b.bytes[0]!);

  const track: number[] = [];
  let lastTick = 0;
  for (const ev of events) {
    track.push(...writeVarLen(ev.tick - lastTick));
    track.push(...ev.bytes);
    lastTick = ev.tick;
  }
  track.push(...writeVarLen(0), 0xff, 0x2f, 0x00);

  const header = [
    0x4d,
    0x54,
    0x68,
    0x64,
    ...writeUint32(6),
    ...writeUint16(0),
    ...writeUint16(1),
    ...writeUint16(ticksPerBeat),
  ];
  const trackHeader = [0x4d, 0x54, 0x72, 0x6b, ...writeUint32(track.length)];
  return new Uint8Array([...header, ...trackHeader, ...track]);
}

function readVarLen(data: Uint8Array, offset: { i: number }): number {
  let value = 0;
  for (;;) {
    const b = data[offset.i++] ?? 0;
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return value;
}

/** Best-effort parser: extracts note on/off events from Type 0/1 SMF files. */
export function parseMidiNotes(data: Uint8Array): MidiNote[] {
  if (data.length < 14) return [];
  const ticksPerBeat = (data[12]! << 8) | data[13]!;
  const notes: MidiNote[] = [];
  const active = new Map<number, { startTick: number; velocity: number }>();
  let i = 14;
  let absoluteTick = 0;
  let runningStatus = 0;

  while (i < data.length - 8) {
    if (data[i] === 0x4d && data[i + 1] === 0x54 && data[i + 2] === 0x72 && data[i + 3] === 0x6b) {
      const len = (data[i + 4]! << 24) | (data[i + 5]! << 16) | (data[i + 6]! << 8) | data[i + 7]!;
      i += 8;
      const end = Math.min(data.length, i + len);
      absoluteTick = 0;
      runningStatus = 0;
      const cursor = { i };
      while (cursor.i < end) {
        absoluteTick += readVarLen(data, cursor);
        let status = data[cursor.i]!;
        if (status < 0x80) {
          status = runningStatus;
        } else {
          cursor.i++;
          if (status < 0xf0) runningStatus = status;
        }
        const cmd = status & 0xf0;
        if (status === 0xff) {
          const meta = data[cursor.i++]!;
          const metaLen = readVarLen(data, cursor);
          cursor.i += metaLen;
          if (meta === 0x2f) break;
        } else if (status === 0xf0 || status === 0xf7) {
          const syxLen = readVarLen(data, cursor);
          cursor.i += syxLen;
        } else if (cmd === 0x90 || cmd === 0x80) {
          const pitch = data[cursor.i++]!;
          const vel = data[cursor.i++]!;
          if (cmd === 0x90 && vel > 0) {
            active.set(pitch, { startTick: absoluteTick, velocity: vel / 127 });
          } else {
            const on = active.get(pitch);
            if (on) {
              notes.push({
                pitch,
                start: on.startTick / ticksPerBeat,
                duration: Math.max(0.05, (absoluteTick - on.startTick) / ticksPerBeat),
                velocity: on.velocity,
                track: 0,
              });
              active.delete(pitch);
            }
          }
        } else if (cmd === 0xc0 || cmd === 0xd0) {
          cursor.i += 1;
        } else if (cmd === 0xa0 || cmd === 0xb0 || cmd === 0xe0) {
          cursor.i += 2;
        } else {
          break;
        }
      }
      i = end;
    } else {
      i++;
    }
  }
  return notes;
}

export function downloadMidi(filename: string, notes: MidiNote[], bpm = 120): void {
  const bytes = writeMidiType0(notes, bpm);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
