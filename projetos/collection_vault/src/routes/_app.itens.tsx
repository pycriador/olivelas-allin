import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useRelOptions } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/itens")({ component: Page });

function Page() {
  const plataformas = useRelOptions("plataformas");
  return (
    <CrudPage
      table="itens"
      title="HARDWARE"
      subtitle="Consoles, controles e acessórios"
      columns={["nome", "tipo", "marca", "ano_lancamento"]}
      fields={[
        { name: "nome", label: "Nome", type: "text", required: true },
        { name: "tipo", label: "Tipo", type: "select", required: true, options: [
          { value: "Console", label: "Console" },
          { value: "Controle", label: "Controle" },
          { value: "Acessório", label: "Acessório" },
        ]},
        { name: "plataforma_id", label: "Plataforma", type: "select", options: plataformas.data ?? [] },
        { name: "marca", label: "Marca", type: "text" },
        { name: "modelo", label: "Modelo", type: "text" },
        { name: "ano_lancamento", label: "Ano", type: "number" },
        { name: "descricao", label: "Descrição", type: "textarea" },
        { name: "imagem_url", label: "URL da imagem", type: "text" },
      ]}
    />
  );
}
