import { HelpCircle, ExternalLink, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { Link, useRouterState } from "@tanstack/react-router";
import { PAGE_DOCS, type PageDoc } from "@/core/docs/page-docs";

function HelpContent({ doc }: { doc: PageDoc }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("help.description")}</h3>
        <p className="text-sm mt-1 leading-relaxed">{doc.description}</p>
      </div>
      {doc.features && doc.features.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("help.features")}</h3>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {doc.features.map((f, i) => (
              <li key={i} className="text-sm leading-relaxed">{f}</li>
            ))}
          </ul>
        </div>
      )}
      {doc.sections && doc.sections.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("help.sections")}</h3>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {doc.sections.map((s, i) => (
              <li key={i} className="text-sm leading-relaxed"><strong>{s.title}:</strong> {s.content}</li>
            ))}
          </ul>
        </div>
      )}
      {doc.relatedSprints && doc.relatedSprints.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("help.relatedSprints")}: {doc.relatedSprints.join(", ")}
        </p>
      )}
    </div>
  );
}

export function HelpButton() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const doc = PAGE_DOCS[pathname] || PAGE_DOCS["/"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("help.title")}>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{doc.title}</DialogTitle>
          <DialogDescription>{t("help.pageHelp")}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-4">
          <HelpContent doc={doc} />
        </ScrollArea>
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
          <Button variant="default" size="sm" asChild className="flex-1">
            <Link to="/how-it-works">
              <Sparkles className="h-4 w-4 mr-2" />
              Como Funciona o Sistema
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a href="/manual-do-sistema.html" target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-4 w-4 mr-2" />
              Manual HTML Público
              <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
