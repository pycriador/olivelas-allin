import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ClientPortfolio, ClientServiceItem } from "@/lib/client-aggregation";
import { cleanPhoneForWhatsApp } from "@/lib/client-aggregation";

interface ClientServicesPaginationProps {
  portfolio: ClientPortfolio;
  currentArtId?: string;
  itemsPerPage?: number;
  compact?: boolean;
}

export function ClientServicesPagination({
  portfolio,
  currentArtId,
  itemsPerPage = 8,
  compact = false,
}: ClientServicesPaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "service" | "product" | "promotion">("all");

  // Filtra serviços e produtos
  const filteredServices = useMemo(() => {
    return portfolio.services.filter((s) => {
      const matchesSearch =
        !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === "all" || s.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [portfolio.services, searchTerm, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const currentSafePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentSafePage - 1) * itemsPerPage;
    return filteredServices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServices, currentSafePage, itemsPerPage]);

  function copyClientId() {
    navigator.clipboard.writeText(portfolio.clientId);
    toast.success(`Client ID "${portfolio.clientId}" copiado!`);
  }

  function handleOrderWhatsApp(item: ClientServiceItem) {
    const cleanPhone = cleanPhoneForWhatsApp(portfolio.normalizedPhone);
    const msg = encodeURIComponent(
      `Olá! Vi o anúncio no catálogo para "${item.name}"${item.price ? ` (${item.price})` : ""} e gostaria de mais informações.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  }

  const getTypeBadge = (type: "service" | "product" | "promotion") => {
    switch (type) {
      case "service":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
            <span>🛠️</span> Serviço
          </span>
        );
      case "promotion":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
            <span>🔥</span> Promoção
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
            <span>📦</span> Produto
          </span>
        );
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f18]/80 p-4 sm:p-6 backdrop-blur-xl shadow-2xl">
      {/* Header do Perfil do Estabelecimento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-signal flex items-center gap-1.5">
              <span>💼</span> Perfil do Estabelecimento
            </span>
            <button
              onClick={copyClientId}
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-signal/15 border border-signal/30 px-2.5 py-0.5 font-mono text-[11px] font-bold text-signal hover:bg-signal/25 transition cursor-pointer"
              title="Clique para copiar o Client ID"
            >
              <span>{portfolio.clientId}</span>
              <span className="text-[10px] text-signal/80">⧉</span>
            </button>
          </div>

          <h3 className="mt-1.5 text-lg sm:text-xl font-bold text-ink break-words leading-tight">
            {portfolio.clientName || "Estabelecimento Parceiro"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-dim">
            <span className="flex items-center gap-1">
              <span>📱</span> WhatsApp:{" "}
              <strong className="text-ink font-mono">{portfolio.formattedPhone || portfolio.normalizedPhone}</strong>
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1">
              <span>🎨</span> <strong className="text-ink">{portfolio.totalArts}</strong>{" "}
              {portfolio.totalArts === 1 ? "arte enviada" : "artes enviadas"}
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1">
              <span>📋</span> <strong className="text-ink">{portfolio.totalServices}</strong>{" "}
              {portfolio.totalServices === 1 ? "item cadastrado" : "itens cadastrados"}
            </span>
          </div>
        </div>

        {/* Botão de contato direto geral */}
        <a
          href={`https://wa.me/${cleanPhoneForWhatsApp(portfolio.normalizedPhone)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition shrink-0 cursor-pointer shadow-md shadow-emerald-950/40"
        >
          <span>💬</span>
          <span>Falar no WhatsApp</span>
        </a>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar entre os produtos e serviços deste cliente..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none transition"
          />
          <svg
            className="absolute left-3 top-2.5 size-3.5 text-dim"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filtros por Categoria/Tipo */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {(
            [
              { id: "all", label: "Todos" },
              { id: "service", label: "Serviços" },
              { id: "product", label: "Produtos" },
              { id: "promotion", label: "Promoções" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setFilterType(t.id);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0 ${
                filterType === t.id
                  ? "bg-signal text-canvas shadow-sm shadow-signal/30"
                  : "bg-white/5 text-dim hover:text-ink hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Serviços / Produtos (Até 8 itens por página) */}
      {paginatedItems.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-8 text-center text-xs text-dim">
          Nenhum serviço ou produto encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-xs text-ink">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-wider text-dim">
                  <th className="py-3 px-4 font-semibold">Item / Descrição</th>
                  <th className="py-3 px-3 font-semibold text-center w-28">Tipo</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Preço</th>
                  <th className="py-3 px-3 font-semibold text-center w-36">Origem</th>
                  <th className="py-3 px-4 font-semibold text-right w-32">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.map((item, idx) => {
                  const isFromCurrentArt = item.sourceArtId === currentArtId;

                  return (
                    <tr
                      key={item.id || idx}
                      className={`transition-colors hover:bg-white/[0.03] ${
                        isFromCurrentArt ? "bg-signal/[0.03]" : ""
                      }`}
                    >
                      {/* Coluna 1: Nome e Descrição */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="min-w-0 max-w-sm sm:max-w-md">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-semibold text-ink text-sm break-words leading-snug">
                              {item.name}
                            </span>
                            {item.category && (
                              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-dim">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="mt-1 text-xs text-dim leading-relaxed line-clamp-2 break-words text-pretty">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Coluna 2: Tipo (Badge) */}
                      <td className="py-3.5 px-3 align-middle text-center">
                        {getTypeBadge(item.type)}
                      </td>

                      {/* Coluna 3: Preço */}
                      <td className="py-3.5 px-3 align-middle text-right">
                        {item.price ? (
                          <span className="inline-block rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
                            {item.price}
                          </span>
                        ) : (
                          <span className="font-mono text-dim text-xs">—</span>
                        )}
                      </td>

                      {/* Coluna 4: Origem da Arte */}
                      <td className="py-3.5 px-3 align-middle text-center">
                        <div className="inline-flex items-center gap-2">
                          {item.sourceImageUrl && (
                            <img
                              src={item.sourceImageUrl}
                              alt="Miniatura"
                              className="size-6 shrink-0 rounded object-cover border border-white/10"
                            />
                          )}
                          {isFromCurrentArt ? (
                            <span className="rounded bg-signal/20 border border-signal/30 px-2 py-0.5 text-[10px] font-bold text-signal">
                              Arte Atual
                            </span>
                          ) : (
                            <Link
                              to="/anuncio/$id"
                              params={{ id: item.sourceArtId }}
                              className="text-[11px] font-medium text-dim hover:text-signal underline underline-offset-2 transition truncate max-w-[90px]"
                              title="Ver anúncio completo"
                            >
                              Ver anúncio ↗
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Coluna 5: Ação WhatsApp */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => handleOrderWhatsApp(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer shrink-0 shadow-sm"
                        >
                          <span>💬</span>
                          <span>Pedir</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rodapé e Controles de Paginação */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
        <div className="text-dim text-center sm:text-left">
          Exibindo{" "}
          <strong className="text-ink">
            {filteredServices.length === 0 ? 0 : (currentSafePage - 1) * itemsPerPage + 1}–
            {Math.min(currentSafePage * itemsPerPage, filteredServices.length)}
          </strong>{" "}
          de <strong className="text-ink">{filteredServices.length}</strong> itens cadastrados
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentSafePage === 1}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-dim hover:text-ink hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              ← Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentSafePage - 3), currentSafePage + 2)
              .map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`size-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentSafePage === page
                      ? "bg-signal text-canvas font-bold shadow-sm shadow-signal/30"
                      : "bg-white/5 text-dim hover:text-ink hover:bg-white/10"
                  }`}
                >
                  {page}
                </button>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentSafePage === totalPages}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-dim hover:text-ink hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
