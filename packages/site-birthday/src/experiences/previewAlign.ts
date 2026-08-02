/**
 * Map bbox-normalized region of Image A onto a screen rect, then animate to identity.
 *
 * Image A is laid out as the destination viewport (100vw × 100vh).
 * `bbox` is the normalized rect of Image B inside A.
 * `fromRect` is where that content currently appears (e.g. snow-globe aperture).
 *
 * Initial transform places A's bbox over `fromRect`; final transform is identity
 * so A fills the viewport — one continuous camera zoom.
 */
export function previewAlignTransform(
  fromRect: { left: number; top: number; width: number; height: number },
  bbox: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
): { scale: number; tx: number; ty: number } {
  const regionW = Math.max(1e-6, bbox.width * viewport.width);
  const regionH = Math.max(1e-6, bbox.height * viewport.height);
  const scale = Math.min(fromRect.width / regionW, fromRect.height / regionH);
  const mappedW = regionW * scale;
  const mappedH = regionH * scale;
  const tx =
    fromRect.left +
    (fromRect.width - mappedW) / 2 -
    bbox.x * viewport.width * scale;
  const ty =
    fromRect.top +
    (fromRect.height - mappedH) / 2 -
    bbox.y * viewport.height * scale;
  return { scale, tx, ty };
}

export function transformCss(t: { scale: number; tx: number; ty: number }): string {
  return `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;
}
