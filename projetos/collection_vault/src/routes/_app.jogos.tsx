import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useRelOptions } from "@/components/crud/CrudPage";
import { JogoGallery } from "@/components/crud/JogoGallery";

export const Route = createFileRoute("/_app/jogos")({ component: Page });

function Page() {
  const series = useRelOptions("series");
  const generos = useRelOptions("generos");
  const subgeneros = useRelOptions("subgeneros");
  const empresas = useRelOptions("empresas");

  return (
    <CrudPage
      table="jogos"
      title="JOGOS"
      subtitle="Catálogo de jogos cadastrados"
      columns={["titulo", "ano_lancamento", "nota_metacritic", "possui_online"]}
      thumbField="thumb_url"
      rowExtras={(row) => <JogoGallery jogoId={row.id} thumbUrl={row.thumb_url} />}
      fields={[
        { name: "titulo", label: "Título", type: "text", required: true },
        { name: "titulo_alternativo", label: "Título alternativo", type: "text" },
        { name: "ano_lancamento", label: "Ano de lançamento", type: "number" },
        { name: "serie_id", label: "Série", type: "select", options: series.data ?? [] },
        { name: "genero_id", label: "Gênero", type: "select", options: generos.data ?? [] },
        { name: "subgenero_id", label: "Subgênero", type: "select", options: subgeneros.data ?? [] },
        { name: "desenvolvedora_id", label: "Desenvolvedora", type: "select", options: empresas.data ?? [] },
        { name: "publicadora_id", label: "Publicadora", type: "select", options: empresas.data ?? [] },
        { name: "classificacao_indicativa", label: "Classificação", type: "text" },
        { name: "numero_jogadores", label: "Nº de jogadores", type: "text" },
        { name: "possui_online", label: "Possui online", type: "boolean" },
        { name: "tempo_medio_jogo", label: "Tempo médio (min)", type: "number" },
        { name: "nota_metacritic", label: "Nota Metacritic", type: "number" },
        { name: "descricao", label: "Descrição", type: "textarea" },
        { name: "link_wikipedia", label: "Link Wikipedia", type: "text" },
        { name: "capa_url", label: "URL da capa (externa)", type: "text" },
        { name: "thumb_url", label: "Thumb (URL — ou use galeria)", type: "text" },
      ]}
    />
  );
}
