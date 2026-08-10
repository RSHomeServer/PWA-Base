/**
 * Preview: thin react-webcam integration.
 * Public import: `@songara/pwa-base/preview/react-webcam`
 *
 * Intended Stable home: `@songara/pwa-base/browser` (camera helpers) after product use.
 */

export { default as Webcam } from "react-webcam";
export type { WebcamProps } from "react-webcam";

export { songaraWebcamConstraints } from "./songaraWebcamConstraints.js";
export type {
  SongaraWebcamConstraintPrefs,
  SongaraWebcamFacing,
} from "./songaraWebcamConstraints.js";
