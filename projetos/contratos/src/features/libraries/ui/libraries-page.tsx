import { Library } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export function LibrariesPage() {
  return (
    <ModulePlaceholder
      title="Biblioteca de cláusulas"
      icon={Library}
      description="Centralize cláusulas corporativas reutilizáveis nos projetos do workspace."
      plannedFeatures={[
        "CRUD de bibliotecas",
        "Cláusulas com versionamento",
        "Tags e busca",
        "Reuso em projetos",
      ]}
    />
  );
}
