import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, MapPin, Users, FileText, MessageSquare, History, Clock, Wrench, ClipboardList, ShieldCheck, MessageCircle, Paperclip, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id")({
  head: () => ({ meta: [{ title: "Cliente — ServiceForge" }] }),
  component: CustomerDetailLayout,
});

const tabs = [
  { id: "overview", label: "Visão Geral", path: "/service-orders/customers/$id", icon: Eye, exact: true },
  { id: "addresses", label: "Endereços", path: "/service-orders/customers/$id/addresses", icon: MapPin },
  { id: "contacts", label: "Contatos", path: "/service-orders/customers/$id/contacts", icon: Users },
  { id: "documents", label: "Documentos", path: "/service-orders/customers/$id/documents", icon: FileText },
  { id: "notes", label: "Observações", path: "/service-orders/customers/$id/notes", icon: MessageSquare },
  { id: "timeline", label: "Timeline", path: "/service-orders/customers/$id/timeline", icon: History },
  { id: "history", label: "Histórico", path: "/service-orders/customers/$id/history", icon: Clock },
  { id: "equipment", label: "Equipamentos", path: "/service-orders/customers/$id/equipment", icon: Wrench },
  { id: "service-orders", label: "Ordens de Serviço", path: "/service-orders/customers/$id/service-orders", icon: ClipboardList },
  { id: "warranties", label: "Garantias", path: "/service-orders/customers/$id/warranties", icon: ShieldCheck },
  { id: "communications", label: "Comunicações", path: "/service-orders/customers/$id/communications", icon: MessageCircle },
  { id: "attachments", label: "Anexos", path: "/service-orders/customers/$id/attachments", icon: Paperclip },
  { id: "relationships", label: "Relacionamentos", path: "/service-orders/customers/$id/relationships", icon: Share2 },
];

function CustomerDetailLayout() {
  const { id } = Route.useParams();
  const location = useLocation();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const currentTab = tabs.find((tab) => tab.exact ? location.pathname === `/service-orders/customers/${id}` : location.pathname.startsWith(`/service-orders/customers/${id}/${tab.id}`)) ?? tabs[0];

  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700", blocked: "bg-red-100 text-red-700" };
  const statusLabels: Record<string, string> = { active: "Ativo", inactive: "Inativo", blocked: "Bloqueado" };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/service-orders/customers/list"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
              <Badge className={statusColors[customer.status]} variant="outline">{statusLabels[customer.status]}</Badge>
              <Badge variant="secondary">{customer.type === "individual" ? "PF" : "PJ"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{customer.cpf ?? customer.cnpj ?? ""}{customer.email ? ` · ${customer.email}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="border-b overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === `/service-orders/customers/${id}`
              : location.pathname.startsWith(`/service-orders/customers/${id}/${tab.id}`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path as any}
                params={{ id } as never}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
