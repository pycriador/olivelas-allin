import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { roleService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { Role, PermissionEntry } from "@/modules/admin/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PERMISSION_KEYS: { key: keyof PermissionEntry; label: string }[] = [
  { key: "canView", label: "Visualizar" },
  { key: "canCreate", label: "Criar" },
  { key: "canEdit", label: "Editar" },
  { key: "canDelete", label: "Excluir" },
  { key: "canPrint", label: "Imprimir" },
  { key: "canExport", label: "Exportar" },
  { key: "canImport", label: "Importar" },
  { key: "canPublish", label: "Publicar" },
  { key: "canAdmin", label: "Administrar" },
];

export const Route = createFileRoute("/_app/admin/permissions")({
  head: () => ({ meta: [{ title: "Admin Permissões — ServiceForge" }] }),
  component: AdminPermissionsPage,
});

function AdminPermissionsPage() {
  const { t } = useTranslation();
  const { data: roles = [] } = useQuery({ queryKey: ["admin", "roles", "list"], queryFn: () => roleService.list() });
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [localPermissions, setLocalPermissions] = useState<Record<string, PermissionEntry>>({});

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (id: string) => {
    setSelectedRoleId(id);
    const role = roles.find((r) => r.id === id);
    if (role) {
      const map: Record<string, PermissionEntry> = {};
      for (const p of role.permissions) map[p.resource] = p;
      setLocalPermissions(map);
    }
  };

  const togglePermission = (resource: string, key: keyof PermissionEntry) => {
    setLocalPermissions((prev) => {
      const current = prev[resource] ?? { resource, canView: false, canCreate: false, canEdit: false, canDelete: false, canPrint: false, canExport: false, canImport: false, canPublish: false, canAdmin: false };
      return { ...prev, [resource]: { ...current, [key]: !current[key] } };
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    const permissions = Object.values(localPermissions);
    await roleService.update(selectedRoleId, { permissions });
    toast.success("Permissões atualizadas com sucesso");
  };

  const allResources = Array.from(new Set([
    ...(selectedRole?.permissions.map((p) => p.resource) ?? []),
    "dashboard", "companies", "users", "roles", "permissions", "database",
    "settings", "audit", "logs", "system", "service-orders", "financial",
    "inventory", "documents", "communication",
  ]));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("admin.permissions")}</h1>
          <DocButton module="admin" page="permissions" title="Permissões" />
        </div>
        <p className="text-sm text-muted-foreground">Gerencie as permissões granulares por papel</p>
      </div>

      <div className="max-w-xs">
        <Label>Selecione o Papel</Label>
        <Select value={selectedRoleId} onValueChange={handleSelectRole}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um papel..." />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedRole.color }} />
              {t("admin.permissionsFor")}: {selectedRole.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Recurso</th>
                    {PERMISSION_KEYS.map((pk) => (
                      <th key={pk.key} className="text-center py-2 px-2 font-medium text-xs">{pk.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allResources.map((resource) => {
                    const perm = localPermissions[resource] ?? { resource, canView: false, canCreate: false, canEdit: false, canDelete: false, canPrint: false, canExport: false, canImport: false, canPublish: false, canAdmin: false };
                    return (
                      <tr key={resource} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 pr-4 font-medium capitalize">{resource}</td>
                        {PERMISSION_KEYS.map((pk) => (
                          <td key={pk.key} className="text-center py-2 px-2">
                            <Checkbox
                              checked={perm[pk.key] as boolean}
                              onCheckedChange={() => togglePermission(resource, pk.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave}>Salvar Permissões</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
