import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useRelOptions } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/links")({ component: Page });

function Page() {
  const lojas = useRelOptions("lojas");
  const jogos = useRelOptions("jogos", "titulo");
  const itens = useRelOptions("itens");
  return (
    <CrudPage
      table="links_compra"
      title="LINKS DE COMPRA"
      subtitle="Compare preços entre lojas"
      columns={["url", "preco", "frete", "disponibilidade"]}
      fields={[
        { name: "loja_id", label: "Loja", type: "select", options: lojas.data ?? [] },
        { name: "jogo_id", label: "Jogo", type: "select", options: jogos.data ?? [] },
        { name: "item_id", label: "Item", type: "select", options: itens.data ?? [] },
        { name: "url", label: "URL", type: "text", required: true },
        { name: "preco", label: "Preço", type: "number", required: true },
        { name: "frete", label: "Frete", type: "number" },
        { name: "disponibilidade", label: "Disponível", type: "boolean" },
      ]}
    />
  );
}
