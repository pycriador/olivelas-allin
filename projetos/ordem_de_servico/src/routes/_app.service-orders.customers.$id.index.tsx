import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, MessageSquare, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { customerService } from "@/modules/customers/service";
import type { Customer } from "@/modules/customers/types";

export const Route = createFileRoute("/_app/service-orders/customers/$id/")({
  head: () => ({ meta: [{ title: "Visão Geral — ServiceForge" }] }),
  component: CustomerOverviewTab,
});

function CustomerOverviewTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.get(id),
  });

  const statusColors: Record<string, string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-700", blocked: "bg-red-100 text-red-700" };
  const statusLabels: Record<string, string> = { active: "Ativo", inactive: "Inativo", blocked: "Bloqueado" };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!customer) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">Cliente não encontrado</p></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações Básicas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{customer.name}</p></div>
              <div><span className="text-muted-foreground">Tipo:</span><p className="font-medium">{customer.type === "individual" ? "Pessoa Física" : "Pessoa Jurídica"}</p></div>
              {customer.cpf && <div><span className="text-muted-foreground">CPF:</span><p className="font-medium">{customer.cpf}</p></div>}
              {customer.cnpj && <div><span className="text-muted-foreground">CNPJ:</span><p className="font-medium">{customer.cnpj}</p></div>}
              {customer.rg && <div><span className="text-muted-foreground">RG:</span><p className="font-medium">{customer.rg}</p></div>}
              {customer.birthDate && <div><span className="text-muted-foreground">Data de Nascimento:</span><p className="font-medium">{new Date(customer.birthDate).toLocaleDateString("pt-BR")}</p></div>}
              {customer.email && <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{customer.email}</p></div>}
              {customer.phone && <div><span className="text-muted-foreground">Telefone:</span><p className="font-medium">{customer.phone}</p></div>}
              {customer.cellphone && <div><span className="text-muted-foreground">Celular:</span><p className="font-medium">{customer.cellphone}</p></div>}
              {customer.whatsapp && <div><span className="text-muted-foreground">WhatsApp:</span><p className="font-medium">{customer.whatsapp}</p></div>}
              <div><span className="text-muted-foreground">Status:</span><Badge className={statusColors[customer.status]} variant="outline">{statusLabels[customer.status]}</Badge></div>
              {customer.classification && <div><span className="text-muted-foreground">Classificação:</span><p className="font-medium">{customer.classification}</p></div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Endereços</CardTitle>
            <Link to="/service-orders/customers/$id/addresses" params={{ id }} className="text-sm text-primary hover:underline">Gerenciar</Link>
          </CardHeader>
          <CardContent>
            {(customer.addresses ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
            ) : (
              <div className="space-y-3">
                {(customer.addresses ?? []).slice(0, 3).map((addr) => (
                  <div key={addr.id} className="text-sm border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{addr.label}</span>
                      {addr.isDefault && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                      <Badge variant="outline" className="text-xs">{addr.addressType}</Badge>
                    </div>
                    <p className="text-muted-foreground">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}</p>
                    <p className="text-muted-foreground">{addr.neighborhood} - {addr.city}/{addr.state} - {addr.zipCode}</p>
                  </div>
                ))}
                {(customer.addresses ?? []).length > 3 && (
                  <Link to="/service-orders/customers/$id/addresses" params={{ id }} className="text-sm text-primary hover:underline">Ver todos ({customer.addresses!.length})</Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Contatos</CardTitle>
            <Link to="/service-orders/customers/$id/contacts" params={{ id }} className="text-sm text-primary hover:underline">Gerenciar</Link>
          </CardHeader>
          <CardContent>
            {(customer.contacts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato cadastrado</p>
            ) : (
              <div className="space-y-3">
                {(customer.contacts ?? []).slice(0, 3).map((ct) => (
                  <div key={ct.id} className="text-sm border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ct.name}</span>
                      {ct.isDefault && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                    </div>
                    {ct.position && <p className="text-muted-foreground">{ct.position}</p>}
                    <p className="text-muted-foreground">{ct.email ?? ct.phone ?? ct.cellphone ?? ""}</p>
                  </div>
                ))}
                {(customer.contacts ?? []).length > 3 && (
                  <Link to="/service-orders/customers/$id/contacts" params={{ id }} className="text-sm text-primary hover:underline">Ver todos ({customer.contacts!.length})</Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Timeline Recente</CardTitle></CardHeader>
          <CardContent>
            {(customer.timeline ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
            ) : (
              <div className="space-y-3">
                {(customer.timeline ?? []).slice(-5).reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-1.5 flex-shrink-0" />
                    <div>
                      <p>{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.userName ? `${entry.userName} · ` : ""}{new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Ações Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/customers/$id/addresses" params={{ id }}><MapPin className="mr-2 h-4 w-4" />Adicionar Endereço</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/customers/$id/contacts" params={{ id }}><Users className="mr-2 h-4 w-4" />Adicionar Contato</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/customers/$id/notes" params={{ id }}><MessageSquare className="mr-2 h-4 w-4" />Adicionar Observação</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/service-orders/customers/$id/attachments" params={{ id }}><Paperclip className="mr-2 h-4 w-4" />Adicionar Anexo</Link>
            </Button>
          </CardContent>
        </Card>

        {customer.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
