import { useTranslation } from "@/core/i18n/I18nProvider";
import { APP_VERSION } from "@/core/constants";

export function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t px-6 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
      <span>{t("footer.copyright")}</span>
      <span>v{APP_VERSION}</span>
    </footer>
  );
}
