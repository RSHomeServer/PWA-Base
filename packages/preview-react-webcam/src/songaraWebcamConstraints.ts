export type SongaraWebcamFacing = "user" | "environment";

export type SongaraWebcamConstraintPrefs = {
  facingMode?: SongaraWebcamFacing;
  widthIdeal?: number;
  heightIdeal?: number;
};

/**
 * Builds common MediaTrackConstraints for Songara camera capture.
 * Permission UX and stream lifecycle stay app-owned.
 */
export function songaraWebcamConstraints(
  prefs: SongaraWebcamConstraintPrefs = {},
): MediaTrackConstraints {
  return {
    facingMode: prefs.facingMode ?? "user",
    width: { ideal: prefs.widthIdeal ?? 1280 },
    height: { ideal: prefs.heightIdeal ?? 720 },
  };
}
