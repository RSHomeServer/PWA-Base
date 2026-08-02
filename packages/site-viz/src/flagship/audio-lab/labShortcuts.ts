import type { LabShortcut } from "../../lab/index.js";

export const VISUALISER_SHORTCUTS: LabShortcut[] = [
  { keys: "Space", label: "Play / pause the loaded track", category: "Visualiser" },
  { keys: "L", label: "Toggle loop", category: "Visualiser" },
];

export const STEM_EXPLORER_SHORTCUTS: LabShortcut[] = [
  { keys: "Space", label: "Play / pause all loaded stems", category: "Stem Explorer" },
  { keys: "G", label: "Generate demo stems for empty slots", category: "Stem Explorer" },
];

export const DRUM_SHORTCUTS: LabShortcut[] = [
  { keys: "Space", label: "Play / pause sequencer", category: "Drum Machine" },
  { keys: "1–5", label: "Mute kick / snare / hat / clap / tom", category: "Drum Machine" },
  { keys: "C", label: "Copy pattern", category: "Drum Machine" },
  { keys: "V", label: "Paste pattern", category: "Drum Machine" },
  { keys: "Z", label: "Undo", category: "Drum Machine" },
  { keys: "Y", label: "Redo", category: "Drum Machine" },
];

export const PIANO_ROLL_SHORTCUTS: LabShortcut[] = [
  { keys: "Space", label: "Play / pause piano roll", category: "Piano Roll" },
  { keys: "Q", label: "Quantize selected / all notes", category: "Piano Roll" },
];

export const SYNTH_SHORTCUTS: LabShortcut[] = [
  { keys: "A–L / Z–M", label: "Play computer keyboard notes", category: "Live Synth" },
  { keys: "MIDI", label: "Hardware keyboard via Web MIDI if available", category: "Live Synth" },
];
