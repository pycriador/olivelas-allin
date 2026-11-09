import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  MoreVertical,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { OperationalReportsSummary } from '@/types/operations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function ReportsPage() {
  const { currentRestaurant } = useRestaurant();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const summary: OperationalReportsSummary = useMemo(() => {
    if (!currentRestaurant) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageTicket: 0,
        activeTablesCount: 0,
        topSellingProducts: [],
        salesByCategory: [],
        salesByPaymentMethod: [],
        hourlyTraffic: [],
      };
    }
    return operationsService.getReportsSummary(currentRestaurant.id);
  }, [currentRestaurant, period]);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Produto,Quantidade,Receita (R$)']
        .concat(
          summary.topSellingProducts.map(
            (p) => `"${p.name}",${p.quantity},${p.revenue.toFixed(2)}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_olivelas_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV exportado com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Relatórios &amp; Inteligência
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[10px]">
              Visão Gerencial
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análise em tempo real de faturamento, pratos mais consumidos e métodos de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                period === 'today'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                period === 'week'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                period === 'month'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Este Mês
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </Button>

          {/* Radix Dropdown Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Ações ▾
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                Exportar Planilha (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 mr-2" />
                Imprimir Relatório
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.success('Link do relatório copiado!')}>
                <Share2 className="h-3.5 w-3.5 mr-2" />
                Compartilhar Resumo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Top KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Receita Bruta Total</p>
              <p className="text-2xl font-bold text-foreground mt-0.5 font-mono">
                R$ {summary.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Ticket Médio</p>
              <p className="text-2xl font-bold text-primary mt-0.5 font-mono">
                R$ {summary.averageTicket.toFixed(2)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pedidos Realizados</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {summary.totalOrders}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Mesas Ocupadas</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">
                {summary.activeTablesCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Gráficos e Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Produtos Mais Vendidos */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Produtos Líderes de Vendas
            </CardTitle>
            <CardDescription className="text-xs">
              Itens com maior saída e receita acumulada no período.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.topSellingProducts.map((prod, idx) => {
              const maxQ = summary.topSellingProducts[0]?.quantity || 1;
              const pct = Math.round((prod.quantity / maxQ) * 100);
              return (
                <div key={prod.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        #{idx + 1}
                      </span>
                      {prod.name}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {prod.quantity} un • R$ {prod.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Faturamento por Categoria */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Composição de Vendas por Categoria
            </CardTitle>
            <CardDescription className="text-xs">
              Percentual de receita por família de itens do cardápio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.salesByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">{cat.category}</span>
                  <span className="font-mono text-muted-foreground">
                    R$ {cat.revenue.toFixed(2)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vendas por Meio de Pagamento */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Meios de Pagamento Utilizados
            </CardTitle>
            <CardDescription className="text-xs">
              Conciliação de transações recebidas no caixa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {summary.salesByPaymentMethod.map((item) => (
                <div
                  key={item.method}
                  className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.count} transações registradas
                    </p>
                  </div>
                  <span className="font-mono font-bold text-foreground text-sm">
                    R$ {item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Curva de Atendimento / Horários */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Picos de Atendimento por Horário
            </CardTitle>
            <CardDescription className="text-xs">
              Fluxo horário de pedidos e faturamento gerado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.hourlyTraffic.map((traffic) => (
              <div key={traffic.hour} className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-foreground w-14">
                  {traffic.hour}
                </span>
                <div className="flex-1 mx-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, traffic.orders * 4)}%` }}
                  />
                </div>
                <div className="w-28 text-right font-mono text-muted-foreground">
                  {traffic.orders} ped. (R$ {traffic.revenue})
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Share2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
