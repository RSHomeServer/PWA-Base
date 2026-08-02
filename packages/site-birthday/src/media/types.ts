/** Reusable media models for Birthday experiences. */

export type MediaFormat =
  | "mp3"
  | "wav"
  | "ogg"
  | "m4a"
  | "jpg"
  | "jpeg"
  | "png"
  | "webp"
  | "mp4"
  | "webm"
  | "mkv"
  | "unknown";

export type VoiceNoteItem = {
  id: string;
  title: string;
  description: string;
  src: string;
  format: MediaFormat;
  coverImage?: string;
  durationSec?: number;
  attribution?: string;
};

export type PhotoItem = {
  id: string;
  title: string;
  caption: string;
  src: string;
  format: MediaFormat;
  date?: string;
  attribution?: string;
};

export type VideoItem = {
  id: string;
  title: string;
  description: string;
  src: string;
  format: MediaFormat;
  thumbnail?: string;
  durationSec?: number;
  /** When false, UI shows a graceful unsupported notice. */
  playable?: boolean;
  attribution?: string;
};

export type MediaCatalog = {
  version: number;
  voiceNotes: VoiceNoteItem[];
  photos: PhotoItem[];
  videos: VideoItem[];
};
