function triggerDownload(filename: string, url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(filename, url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadText(
  filename: string,
  text: string,
  mime = "text/plain;charset=utf-8",
): void {
  downloadBlob(filename, new Blob([text], { type: mime }));
}

export function downloadCanvasPng(filename: string, canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error("Failed to export canvas as PNG");
    }
    downloadBlob(filename, blob);
  }, "image/png");
}
