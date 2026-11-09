function escapePdfText(value: string): string {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, " ")
    .replace(/[\\()]/g, (m) => `\\${m}`);
  return normalized;
}

function escaped(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    let code = ch.codePointAt(0) ?? 0;
    if (code > 0xffff) {
      code = 0xfffd;
    }
    out.push(code);
  }
  return out;
}

function buildContent(widthPt: number, heightPt: number, lines: string[]): string {
  const streamParts: string[] = [];
  streamParts.push(`q`);
  streamParts.push(`BT`);
  streamParts.push(`/F1 11 Tf`);
  streamParts.push(`10 ${heightPt - 40} Td`);
  streamParts.push(`14 TL`);
  for (const line of lines) {
    const safe = escapePdfText(line);
    streamParts.push(`(${safe}) Tj`);
    streamParts.push(`T*`);
  }
  streamParts.push(`ET`);
  streamParts.push(`Q`);
  const content = streamParts.join("\n");
  return content;
}

export class DocumentExporter {
  toMarkdown(title: string, sections: { heading?: string; body: string }[]): string {
    const parts: string[] = [`# ${title}`, ""];
    for (const section of sections) {
      if (section.heading) {
        parts.push(`## ${section.heading}`, "");
      }
      const body = section.body
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      parts.push(body.join("\n\n"), "");
    }
    return parts.join("\n").trim() + "\n";
  }

  toTxt(title: string, sections: { heading?: string; body: string }[]): string {
    const parts: string[] = [title.toUpperCase(), ""];
    for (const section of sections) {
      if (section.heading) {
        parts.push(section.heading.toUpperCase(), "");
      }
      parts.push(section.body.trim(), "");
    }
    return parts.join("\n").trim() + "\n";
  }

  toPdf(title: string, sections: { heading?: string; body: string }[]): string {
    const widthPt = 595.28;
    const heightPt = 841.89;
    const marginPt = 40;
    const maxCharsPerLine = 95;

    const lines: string[] = [title.toUpperCase(), "=".repeat(Math.min(title.length, 50))];
    for (const section of sections) {
      if (section.heading) {
        lines.push("");
        lines.push(section.heading.toUpperCase());
      }
      const body = section.body.trim();
      if (!body) continue;
      lines.push("");
      for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
        const trimmed = raw.trim();
        if (!trimmed) {
          lines.push("");
          continue;
        }
        for (let i = 0; i < trimmed.length; i += maxCharsPerLine) {
          lines.push(trimmed.slice(i, i + maxCharsPerLine));
        }
      }
    }

    const content = buildContent(widthPt, heightPt, lines);
    const contentStream = escaped(content);

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      `<< /Length ${contentStream.length} >>\nstream\n${content}\nendstream`,
    ];

    const body = ["%PDF-1.4", ...objects.map((obj, i) => `${i + 1} 0 obj\n${obj}\nendobj`)].join(
      "\n",
    );

    const offsets = ["0"];
    let cursor = 0;
    const bodyLines = body.split("\n");
    for (const line of bodyLines) {
      cursor += line.length + 1;
      offsets.push(String(cursor));
    }

    const xrefStart = (() => {
      let len = 0;
      for (const line of bodyLines) {
        len += line.length + 1;
      }
      return len;
    })();

    const xrefEntries = offsets
      .map((off, i) => `${String(off).padStart(10, "0")} 00000 n`)
      .join("\n");

    const trailer = [
      "trailer",
      `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
      "startxref",
      String(xrefStart),
      "%%EOF",
    ].join("\n");

    return body + "\n" + xrefEntries + "\n" + trailer + "\n";
  }

  export(
    title: string,
    format: "pdf" | "markdown" | "txt",
    sections: { heading?: string; body: string }[],
  ) {
    if (format === "pdf") return this.toPdf(title, sections);
    if (format === "markdown") return this.toMarkdown(title, sections);
    return this.toTxt(title, sections);
  }
}

export const documentExporter = new DocumentExporter();
