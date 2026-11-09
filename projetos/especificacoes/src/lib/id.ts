function secureRandomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const uid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const s = secureRandomHex;
  return `${s(8)}-${s(4)}-4${s(3)}-${s(4)}-${s(12)}`;
};
