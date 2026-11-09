export interface WhatsAppTemplateVars {
  title: string;
  collection: string;
  code: string;
  url: string;
}

const DEFAULT_TEMPLATE =
  "Olá! Tenho interesse na arte {{title}} (código {{code}}) da coleção {{collection}}. Link: {{url}}";

export function renderWhatsAppMessage(template: string | null | undefined, vars: WhatsAppTemplateVars): string {
  const tpl = template && template.trim().length > 0 ? template : DEFAULT_TEMPLATE;
  return tpl
    .replaceAll("{{title}}", vars.title)
    .replaceAll("{{collection}}", vars.collection)
    .replaceAll("{{code}}", vars.code)
    .replaceAll("{{url}}", vars.url);
}

export function buildWhatsAppUrl(rawNumber: string, message: string): string {
  const digits = rawNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
