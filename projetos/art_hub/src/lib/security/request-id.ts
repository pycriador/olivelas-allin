let counter = 0;

export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  counter = (counter + 1) % 1_000_000;
  return `${ts}-${rand}-${counter}`;
}
