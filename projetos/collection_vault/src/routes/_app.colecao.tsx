import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useRelOptions } from "@/components/crud/CrudPage";

export const Route = createFileRoute("/_app/colecao")({ component: Page });

function Page() {
  const jogos = useRelOptions("jogos", "titulo");
  const itens = useRelOptions("itens");
  const plataformas = useRelOptions("plataformas");
  return (
    <CrudPage
      table="colecao"
      title="COLEÇÃO"
      subtitle="Seu inventário completo"
      columns={["tipo_item", "formato", "status", "condicao", "preco_pago", "nota_pessoal"]}
      fields={[
        { name: "tipo_item", label: "Tipo", type: "select", required: true, options: [
          { value: "Jogo", label: "Jogo" },
          { value: "Item", label: "Item (hardware)" },
        ]},
        { name: "jogo_id", label: "Jogo", type: "select", options: jogos.data ?? [] },
        { name: "item_id", label: "Item", type: "select", options: itens.data ?? [] },
        { name: "plataforma_id", label: "Plataforma", type: "select", options: plataformas.data ?? [] },
        { name: "formato", label: "Formato", type: "select", options: [
          { value: "Físico", label: "Físico" },
          { value: "Digital", label: "Digital" },
        ]},
        { name: "regiao", label: "Região", type: "text" },
        { name: "edicao", label: "Edição", type: "text" },
        { name: "midia", label: "Mídia", type: "text" },
        { name: "completo", label: "CIB (Complete in Box)", type: "boolean" },
        { name: "condicao", label: "Condição", type: "text" },
        { name: "data_compra", label: "Data da compra", type: "date" },
        { name: "preco_pago", label: "Preço pago", type: "number" },
        { name: "local_compra", label: "Local da compra", type: "text" },
        { name: "status", label: "Status", type: "select", options: [
          { value: "Backlog", label: "Backlog" },
          { value: "Jogando", label: "Jogando" },
          { value: "Finalizado", label: "Finalizado" },
        ]},
        { name: "nota_pessoal", label: "Nota pessoal (0-10)", type: "number" },
        { name: "localizacao_fisica", label: "Localização física", type: "text" },
        { name: "observacoes", label: "Observações", type: "textarea" },
      ]}
    />
  );
}
