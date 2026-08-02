/** Yields control back to the browser so progress UI can repaint during heavy sync work. */
export function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
