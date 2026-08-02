export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifySha256(data: ArrayBuffer, expected: string): Promise<boolean> {
  const normalized = expected.toLowerCase().replace(/^sha256:/, "");
  const actual = await sha256Hex(data);
  return actual === normalized;
}
