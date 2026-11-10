import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/empresas")({ component: Page });

function Page() {
  return (
    <CrudPage
      table="empresas"
      title="EMPRESAS"
      subtitle="Desenvolvedoras e publicadoras"
      columns={["nome", "tipo", "pais", "website"]}
      fields={[
        { name: "nome", label: "Nome", type: "text", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: [
          { value: "Desenvolvedora", label: "Desenvolvedora" },
          { value: "Publicadora", label: "Publicadora" },
          { value: "Ambos", label: "Ambos" },
        ]},
        { name: "pais", label: "País", type: "text" },
        { name: "website", label: "Website", type: "text" },
      ]}
    />
  );
}
