import { useState } from "react";
import { Check, Filter, Hash, Phone, Search, Sparkles, Tag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SearchEvidenceMockup() {
  const [gridQuery, setGridQuery] = useState("10-25, 42, 88");
  const [customerPhone, setCustomerPhone] = useState("1198842");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-xl overflow-hidden backdrop-blur">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-amber-500/60" />
            <span className="size-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-semibold text-foreground ml-2">
            Evidências de Mecanismos de Busca e Filtros Inteligentes
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
          Alta Velocidade
        </Badge>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <Tabs defaultValue="grid-search" className="w-full space-y-4">
          <TabsList className="grid grid-cols-3 w-full h-auto p-1">
            <TabsTrigger value="grid-search" className="text-xs py-2 gap-1.5">
              <Hash className="size-3.5" />
              1. Busca de Cotas (Intervalos & Listas)
            </TabsTrigger>
            <TabsTrigger value="crm-search" className="text-xs py-2 gap-1.5">
              <Phone className="size-3.5" />
              2. Busca Instantânea de Clientes
            </TabsTrigger>
            <TabsTrigger value="orders-filter" className="text-xs py-2 gap-1.5">
              <Filter className="size-3.5" />
              3. Filtros Avançados de Pedidos
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Busca de Cotas */}
          <TabsContent value="grid-search" className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Entrada Inteligente de Números:
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => setGridQuery("1-10")}
                  >
                    Exemplo 1-10
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => setGridQuery("1,5,8,20")}
                  >
                    Exemplo 1,5,8,20
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => setGridQuery("10-25, 42, 88")}
                  >
                    Exemplo Combinado
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={gridQuery}
                  onChange={(e) => setGridQuery(e.target.value)}
                  placeholder="Digite: 1-50 ou 10,20,30..."
                  className="pl-9 h-10 font-mono text-sm"
                />
              </div>

              <div className="rounded-lg bg-background border border-border p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Resultado da Interpretação pelo Sistema:</span>
                  <span className="font-bold text-primary">18 números interpretados</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 42, 88].map((n) => (
                    <Badge key={n} variant="secondary" className="font-mono text-[11px] bg-primary/10 text-primary border border-primary/20">
                      #{String(n).padStart(3, "0")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              ⚡ <strong>Algoritmo de parsing:</strong> O sistema analisa automaticamente expressões separadas por vírgula ou traço, remove duplicados e valida conflitos em milissegundos.
            </p>
          </TabsContent>

          {/* Aba 2: CRM Clientes */}
          <TabsContent value="crm-search" className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <label className="text-xs font-semibold text-foreground">
                Digite os dígitos do telefone para pesquisar automaticamente:
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ex: 1198842..."
                  className="pl-9 h-10 font-mono text-sm"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  1 Comprador Encontrado
                </span>
              </div>

              <div className="rounded-lg border border-primary/30 bg-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    MS
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-foreground">Marcos Silva</h5>
                    <p className="text-[11px] text-muted-foreground font-mono">(11) 98842-1100 • São Paulo/SP</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Histórico</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">18 cotas (R$ 450,00)</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              👥 <strong>Reaproveitamento Inteligente:</strong> Ao iniciar uma venda manual ou receber reserva no WhatsApp, o cliente existente é selecionado sem duplicação de registro.
            </p>
          </TabsContent>

          {/* Aba 3: Filtros de Pedidos */}
          <TabsContent value="orders-filter" className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold">Filtros por Estado Operacional:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {["ALL", "WAITING_CONTACT", "WAITING_PAYMENT", "PAID"].map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={orderStatusFilter === st ? "default" : "outline"}
                      className="h-7 text-[11px]"
                      onClick={() => setOrderStatusFilter(st)}
                    >
                      {st === "ALL" ? "Todos" : st === "PAID" ? "Pagos" : st === "WAITING_CONTACT" ? "WhatsApp" : "Aguardando"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                  <div>
                    <span className="font-bold text-foreground">Pedido #ORD-8821</span>
                    <span className="text-[11px] text-muted-foreground block">Marcos Silva • Campanha iPhone 15 Pro</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                    PAID (Pix)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                  <div>
                    <span className="font-bold text-foreground">Pedido #ORD-8820</span>
                    <span className="text-[11px] text-muted-foreground block">Camila Lima • Campanha iPhone 15 Pro</span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                    WAITING_CONTACT (WhatsApp)
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              📊 <strong>Filtros combinados:</strong> Filtre simultaneamente por status, origem (WhatsApp, manual, online), campanha e intervalo de datas.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
