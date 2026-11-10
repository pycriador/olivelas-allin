import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/plataformas")({ component: Page });

function Page() {
  return (
    <CrudPage
      table="plataformas"
      title="PLATAFORMAS"
      subtitle="Consoles, PCs e portáteis"
      columns={["nome", "fabricante", "geracao", "ano_lancamento"]}
      fields={[
        { name: "nome", label: "Nome", type: "text", required: true },
        { name: "fabricante", label: "Fabricante", type: "text" },
        { name: "geracao", label: "Geração", type: "number" },
        { name: "ano_lancamento", label: "Ano de lançamento", type: "number" },
      ]}
    />
  );
}
