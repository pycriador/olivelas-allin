import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";

const LABELS: Record<SupportedLang, string> = {
  "pt-BR": "Português (BR)",
  en: "English",
  es: "Español",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current = (SUPPORTED_LANGS.find((l) => i18n.language?.startsWith(l)) ??
    "pt-BR") as SupportedLang;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="gap-2 rounded-full">
          <Globe className="h-4 w-4" />
          {!compact && <span className="text-xs font-medium">{LABELS[current]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {SUPPORTED_LANGS.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className="flex items-center justify-between"
          >
            <span>{LABELS[lng]}</span>
            {lng === current && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
