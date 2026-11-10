import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Analisa uma imagem (URL pública/HTTP) e retorna descrição em pt-BR,
 * cores predominantes (hex) e tags relevantes para uma vitrine de canecas.
 * Usa Lovable AI Gateway (Gemini).
 */
export const analyzeArtImage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      imageUrl: z.string().url(),
      artName: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada.");

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você analisa artes para capas de caneca. Sempre responda em português do Brasil. Seja conciso e útil para uma vitrine.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `Analise esta arte de capa de caneca${data.artName ? ` chamada "${data.artName}"` : ""}. ` +
                `Retorne via tool call: descrição curta (1-2 frases), 4-6 cores predominantes (hex), e 5-8 tags em português.`,
            },
            { type: "image_url", image_url: { url: data.imageUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "salvar_analise",
            description: "Salva o resultado da análise.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                description: { type: "string" },
                colors: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
              },
              required: ["description", "colors", "tags"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "salvar_analise" } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      const t = await res.text();
      console.error("AI error:", res.status, t);
      throw new Error("Falha ao analisar a imagem.");
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("Resposta inesperada da IA.");

    const args = JSON.parse(call.function.arguments);
    return {
      description: String(args.description ?? "").slice(0, 1000),
      colors: (args.colors ?? []).slice(0, 8).map((c: string) => String(c).slice(0, 16)),
      tags: (args.tags ?? []).slice(0, 12).map((t: string) => String(t).slice(0, 40)),
    };
  });
