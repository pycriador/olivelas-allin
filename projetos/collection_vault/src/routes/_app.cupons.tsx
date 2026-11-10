import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useRelOptions } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/cupons")({ component: Page });

function Page() {
  const lojas = useRelOptions("lojas");
  return (
    <CrudPage
      table="cupons"
      title="CUPONS"
      subtitle="Códigos de desconto por loja"
      columns={["codigo", "tipo_desconto", "valor_desconto", "ativo", "data_fim"]}
      fields={[
        { name: "codigo", label: "Código", type: "text", required: true },
        { name: "loja_id", label: "Loja", type: "select", options: lojas.data ?? [] },
        { name: "tipo_desconto", label: "Tipo", type: "select", required: true, options: [
          { value: "Porcentagem", label: "Porcentagem (%)" },
          { value: "Valor", label: "Valor (R$)" },
        ]},
        { name: "valor_desconto", label: "Valor do desconto", type: "number", required: true },
        { name: "valor_minimo", label: "Valor mínimo", type: "number" },
        { name: "data_inicio", label: "Início", type: "date" },
        { name: "data_fim", label: "Fim", type: "date" },
        { name: "ativo", label: "Ativo", type: "boolean" },
        { name: "descricao", label: "Descrição", type: "textarea" },
      ]}
    />
  );
}
