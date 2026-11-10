import {
  createPage,
  slugify,
  uid,
  type FormDefinition,
  type FormField,
  type FormPage,
  type FormTemplate,
  type SchemaVersion,
} from "@/types/forms";

function field(partial: Partial<FormField> & Pick<FormField, "type" | "label">, order: number): FormField {
  return {
    id: uid("fld"),
    required: false,
    options: [],
    order,
    ...partial,
  } as FormField;
}

function opts(labels: string[]) {
  return labels.map((l) => ({ id: uid("opt"), label: l, value: slugify(l) }));
}

function page(title: string, order: number, fields: FormField[]): FormPage {
  return { id: uid("pg"), title, order, fields };
}

export const mockTemplates: FormTemplate[] = [
  {
    id: "tpl_blank",
    name: "Formulário em branco",
    description: "Comece do zero com uma página vazia.",
    category: "other",
    pages: [createPage(0, "Página 1")],
  },
  {
    id: "tpl_satisfaction",
    name: "Pesquisa de satisfação",
    description: "Meça o NPS e a satisfação dos seus clientes.",
    category: "survey",
    pages: [
      page("Sua experiência", 0, [
        field({ type: "heading", label: "Como foi sua experiência?" }, 0),
        field({ type: "scale", label: "De 0 a 10, o quanto você nos recomendaria?", min: 0, max: 10, required: true }, 1),
        field({ type: "rating", label: "Avaliação geral", max: 5 }, 2),
        field({ type: "long_text", label: "O que podemos melhorar?", placeholder: "Escreva aqui…" }, 3),
      ]),
    ],
  },
  {
    id: "tpl_registration",
    name: "Cadastro",
    description: "Colete dados básicos de novos usuários.",
    category: "registration",
    pages: [
      page("Dados pessoais", 0, [
        field({ type: "short_text", label: "Nome completo", required: true, placeholder: "Seu nome" }, 0),
        field({ type: "email", label: "E-mail", required: true, placeholder: "voce@empresa.com" }, 1),
        field({ type: "phone", label: "Telefone", mask: "(99) 99999-9999" }, 2),
        field({ type: "date", label: "Data de nascimento" }, 3),
      ]),
    ],
  },
  {
    id: "tpl_event",
    name: "Evento",
    description: "Inscrições e confirmação de presença.",
    category: "event",
    pages: [
      page("Inscrição", 0, [
        field({ type: "short_text", label: "Nome do participante", required: true }, 0),
        field({ type: "email", label: "E-mail", required: true }, 1),
        field({ type: "select", label: "Tipo de ingresso", options: opts(["Inteira", "Meia", "Cortesia"]) }, 2),
      ]),
      page("Preferências", 1, [
        field({ type: "multi_select", label: "Trilhas de interesse", options: opts(["Produto", "Engenharia", "Design"]) }, 0),
        field({ type: "long_text", label: "Restrições alimentares" }, 1),
      ]),
    ],
  },
  {
    id: "tpl_feedback",
    name: "Feedback",
    description: "Receba sugestões e reporte de problemas.",
    category: "feedback",
    pages: [
      page("Feedback", 0, [
        field({ type: "radio", label: "Tipo de feedback", options: opts(["Elogio", "Sugestão", "Problema"]), required: true }, 0),
        field({ type: "long_text", label: "Descreva seu feedback", required: true }, 1),
        field({ type: "file", label: "Anexo (opcional)" }, 2),
      ]),
    ],
  },
  {
    id: "tpl_internal",
    name: "Pesquisa interna",
    description: "Clima organizacional e engajamento do time.",
    category: "internal",
    pages: [
      page("Clima", 0, [
        field({ type: "scale", label: "Como você avalia seu nível de satisfação?", min: 1, max: 5 }, 0),
        field({ type: "radio", label: "Você se sente reconhecido?", options: opts(["Sempre", "Às vezes", "Raramente"]) }, 1),
        field({ type: "paragraph", label: "Suas respostas são anônimas." }, 2),
      ]),
    ],
  },
];

const now = new Date();
const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const mockForms: FormDefinition[] = [
  {
    id: "frm_onboarding",
    name: "Onboarding de colaboradores",
    description: "Coleta de dados para novos colaboradores.",
    slug: "onboarding-colaboradores",
    category: "registration",
    groupId: "grp_managers",
    status: "published",
    visibility: "private",
    version: 2,
    pages: mockTemplates[2]!.pages.map((p) => ({ ...p, id: uid("pg"), fields: p.fields.map((f) => ({ ...f, id: uid("fld") })) })),
    createdAt: iso(42),
    updatedAt: iso(3),
    publishedAt: iso(3),
  },
  {
    id: "frm_nps",
    name: "NPS trimestral",
    description: "Pesquisa de satisfação enviada a clientes ativos.",
    slug: "nps-trimestral",
    category: "survey",
    groupId: "grp_admin",
    status: "published",
    visibility: "public",
    version: 1,
    pages: mockTemplates[1]!.pages.map((p) => ({ ...p, id: uid("pg"), fields: p.fields.map((f) => ({ ...f, id: uid("fld") })) })),
    createdAt: iso(30),
    updatedAt: iso(10),
    publishedAt: iso(10),
  },
  {
    id: "frm_evento",
    name: "Summit 2026 — Inscrições",
    description: "Formulário de inscrição do evento anual.",
    slug: "summit-2026-inscricoes",
    category: "event",
    groupId: "grp_users",
    status: "draft",
    visibility: "public",
    version: 1,
    pages: mockTemplates[3]!.pages.map((p) => ({ ...p, id: uid("pg"), fields: p.fields.map((f) => ({ ...f, id: uid("fld") })) })),
    createdAt: iso(12),
    updatedAt: iso(1),
    publishedAt: null,
  },
  {
    id: "frm_clima",
    name: "Pesquisa de clima 2025",
    description: "Edição encerrada da pesquisa interna.",
    slug: "pesquisa-clima-2025",
    category: "internal",
    groupId: "grp_admin",
    status: "archived",
    visibility: "private",
    version: 3,
    pages: mockTemplates[5]!.pages.map((p) => ({ ...p, id: uid("pg"), fields: p.fields.map((f) => ({ ...f, id: uid("fld") })) })),
    createdAt: iso(200),
    updatedAt: iso(120),
    publishedAt: iso(190),
  },
];

export const mockVersions: SchemaVersion[] = mockForms.flatMap((f) =>
  Array.from({ length: f.version }, (_, i) => ({
    id: uid("ver"),
    formId: f.id,
    version: i + 1,
    label: `Versão ${i + 1}`,
    createdAt: iso(40 - i * 5),
    snapshot: f.pages,
  })),
);
