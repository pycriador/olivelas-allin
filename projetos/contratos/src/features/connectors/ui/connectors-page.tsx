import { Plug } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export function ConnectorsPage() {
  return (
    <ModulePlaceholder
      title="Conectores"
      icon={Plug}
      description="Conecte fontes de dados aos seus projetos: Google Sheets, Google Docs, REST API, CSV, XLSX e JSON."
      plannedFeatures={[
        "Google Sheets",
        "Google Docs",
        "REST API",
        "CSV / XLSX / JSON",
        "Credenciais criptografadas",
        "Interface connect/validate/read/write",
      ]}
    />
  );
}
