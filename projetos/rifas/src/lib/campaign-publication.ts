import type { Campaign, CampaignImage, CampaignSettings } from "@/types/campaign";

export interface PublicationCheckItem {
  id: string;
  label: string;
  description: string;
  ok: boolean;
  required: boolean;
}

export interface PublicationReadiness {
  items: PublicationCheckItem[];
  requiredTotal: number;
  requiredDone: number;
  score: number;
  canPublish: boolean;
}

/** Valida se a campanha reúne as condições mínimas para ser publicada. */
export function evaluatePublication(
  campaign: Campaign,
  settings: CampaignSettings | null,
  images: CampaignImage[] = [],
): PublicationReadiness {
  const seoTitle = settings?.seo_title ?? settings?.og_title ?? "";
  const seoDescription = settings?.seo_description ?? settings?.og_description ?? "";

  const items: PublicationCheckItem[] = [
    {
      id: "title",
      label: "Título definido",
      description: "A campanha precisa de um título com ao menos 3 caracteres.",
      ok: (campaign.title ?? "").trim().length >= 3,
      required: true,
    },
    {
      id: "slug",
      label: "Slug único",
      description: "O endereço público /r/<slug> precisa estar preenchido.",
      ok: (campaign.slug ?? "").trim().length >= 3,
      required: true,
    },
    {
      id: "description",
      label: "Descrição completa",
      description: "Descreva o prêmio e as regras com ao menos 30 caracteres.",
      ok: (campaign.description ?? "").trim().length >= 30,
      required: true,
    },
    {
      id: "cover",
      label: "Imagem de capa",
      description: "Defina uma capa para a página pública e o compartilhamento.",
      ok: Boolean(campaign.cover_image) || images.some((image) => image.is_cover),
      required: true,
    },
    {
      id: "numbers",
      label: "Faixa de números válida",
      description: "O número final deve ser maior ou igual ao inicial.",
      ok: campaign.number_end >= campaign.number_start && campaign.total_numbers > 0,
      required: true,
    },
    {
      id: "price",
      label: "Valor por número",
      description: "Informe um valor por número maior que zero.",
      ok: Number(campaign.price_per_number) > 0,
      required: true,
    },
    {
      id: "dates",
      label: "Datas configuradas",
      description: "Defina início e encerramento, com encerramento posterior ao início.",
      ok: Boolean(
        campaign.start_date &&
        campaign.end_date &&
        new Date(campaign.end_date).getTime() > new Date(campaign.start_date).getTime(),
      ),
      required: true,
    },
    {
      id: "contact",
      label: "Contato para compradores",
      description: "Informe nome e telefone/WhatsApp de contato.",
      ok: Boolean(
        (campaign.contact_name ?? "").trim() &&
        ((campaign.contact_phone ?? "").trim() || (settings?.contact_whatsapp ?? "").trim()),
      ),
      required: true,
    },
    {
      id: "public-page",
      label: "Página pública habilitada",
      description: "A visibilidade precisa ser pública e a página pública ativada.",
      ok: campaign.visibility === "PUBLIC" && (settings?.enable_public_page ?? false),
      required: true,
    },
    {
      id: "seo",
      label: "SEO preenchido",
      description: "Meta title e meta description ajudam na indexação e no compartilhamento.",
      ok: seoTitle.trim().length >= 10 && seoDescription.trim().length >= 30,
      required: false,
    },
    {
      id: "share-image",
      label: "Imagem de compartilhamento",
      description: "Uma imagem Open Graph melhora a pré-visualização em redes sociais.",
      ok: Boolean(settings?.share_image || settings?.og_image || campaign.cover_image),
      required: false,
    },
    {
      id: "gallery",
      label: "Galeria com imagens",
      description: "Adicione ao menos uma imagem à galeria da campanha.",
      ok: images.length > 0,
      required: false,
    },
  ];

  const required = items.filter((item) => item.required);
  const requiredDone = required.filter((item) => item.ok).length;
  const done = items.filter((item) => item.ok).length;

  return {
    items,
    requiredTotal: required.length,
    requiredDone,
    score: items.length > 0 ? Math.round((done / items.length) * 100) : 0,
    canPublish: requiredDone === required.length,
  };
}
