import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/lojas")({ component: Page });

function Page() {
  return (
    <CrudPage
      table="lojas"
      title="LOJAS"
      subtitle="Lojas para rastrear preços"
      columns={["nome", "tipo", "url_base"]}
      fields={[
        { name: "nome", label: "Nome", type: "text", required: true },
        { name: "url_base", label: "URL base", type: "text" },
        { name: "tipo", label: "Tipo", type: "text" },
      ]}
    />
  );
}
