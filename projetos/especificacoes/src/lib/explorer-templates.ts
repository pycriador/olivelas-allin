// Quick-start document templates for the Document Studio.
export interface DocTemplate {
  id: string;
  name: string;
  fileName: string;
  extension: string;
  description: string;
  content: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "blank",
    name: "Documento vazio",
    fileName: "documento",
    extension: "md",
    description: "Comece do zero",
    content: "",
  },
  {
    id: "readme",
    name: "README",
    fileName: "README",
    extension: "md",
    description: "Visão geral do projeto",
    content: `# Projeto\n\n## Objetivo\n\n## Contexto\n\n## Tecnologias\n\n## Estrutura\n\n## Roadmap\n`,
  },
  {
    id: "specification",
    name: "Especificação",
    fileName: "Especificacao",
    extension: "md",
    description: "Especificação técnica completa",
    content: `# Especificação\n\n## Objetivo\n\n## Contexto\n\n## Requisitos\n\n## Regras de Negócio\n\n## Critérios de Aceite\n\n## Dependências\n\n## Riscos\n`,
  },
  {
    id: "sprint",
    name: "Sprint",
    fileName: "Sprint",
    extension: "md",
    description: "Planejamento de sprint",
    content: `# Sprint\n\n## Objetivo\n\n## Escopo\n\n## Implementação\n\n## Critérios de Aceite\n\n## Pendências\n\n## Riscos\n`,
  },
  {
    id: "api",
    name: "API",
    fileName: "API",
    extension: "md",
    description: "Contrato de API",
    content: `# API\n\n## Objetivo\n\n## Endpoint\n\n## Request\n\n## Response\n\n## Erros\n\n## Autenticação\n`,
  },
  {
    id: "architecture",
    name: "Arquitetura",
    fileName: "Arquitetura",
    extension: "md",
    description: "Documento de arquitetura",
    content: `# Arquitetura\n\n## Contexto\n\n## Componentes\n\n## Fluxo\n\n\`\`\`mermaid\ngraph TD\n    A[Frontend] --> B[API]\n    B --> C[(Database)]\n\`\`\`\n\n## Dependências\n\n## Decisões Arquiteturais\n`,
  },
  {
    id: "database",
    name: "Banco de Dados",
    fileName: "Banco-de-Dados",
    extension: "md",
    description: "Modelagem de dados",
    content: `# Banco de Dados\n\n## Objetivo\n\n## Entidades\n\n## Relacionamentos\n\n## Índices\n\n## Regras\n`,
  },
  {
    id: "prompt",
    name: "Prompt",
    fileName: "Prompt",
    extension: "md",
    description: "Prompt de IA",
    content: `# Prompt\n\n## Objetivo\n\n## Contexto\n\n## Entradas\n\n## Instruções\n\n## Saída Esperada\n\n## Restrições\n`,
  },
  {
    id: "schema-sql",
    name: "Schema SQL",
    fileName: "schema",
    extension: "sql",
    description: "Script de banco de dados",
    content: `-- Schema\ncreate table example (\n  id uuid primary key,\n  name text not null,\n  created_at timestamptz default now()\n);\n`,
  },
  {
    id: "diagram",
    name: "Diagrama Mermaid",
    fileName: "diagrama",
    extension: "mmd",
    description: "Diagrama Mermaid",
    content: `flowchart TD\n  A[Cliente] --> B[API]\n  B --> C[(Banco)]\n`,
  },
];

export const templateById = (id?: string) => DOC_TEMPLATES.find((t) => t.id === id);
