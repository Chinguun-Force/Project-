export async function sha256Hex(value: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto unavailable");
  }
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyHashedAnswer(
  candidate: string,
  expectedHash: string
): Promise<boolean> {
  const normalized = candidate.trim().toLowerCase();
  const hash = await sha256Hex(normalized);
  return hash === expectedHash.trim().toLowerCase();
}
