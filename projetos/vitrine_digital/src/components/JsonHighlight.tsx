type Token = { text: string; cls: string };

function tokenize(json: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(json))) {
    if (match.index > last) tokens.push({ text: json.slice(last, match.index), cls: "text-faint" });
    if (match[1] && match[2]) {
      tokens.push({ text: match[1], cls: "text-cyan" });
      tokens.push({ text: match[2], cls: "text-faint" });
    } else if (match[1]) {
      tokens.push({ text: match[1], cls: "text-amber" });
    } else {
      tokens.push({ text: match[0], cls: "text-signal" });
    }
    last = match.index + match[0].length;
  }
  if (last < json.length) tokens.push({ text: json.slice(last), cls: "text-faint" });
  return tokens;
}

export function JsonHighlight({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2);
  return (
    <pre className="flex-1 max-w-full overflow-x-auto p-4 font-mono text-[12px] leading-[1.7] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
      <code>
        {tokenize(json).map((token, i) => (
          <span key={i} className={token.cls}>
            {token.text}
          </span>
        ))}
      </code>
    </pre>
  );
}
