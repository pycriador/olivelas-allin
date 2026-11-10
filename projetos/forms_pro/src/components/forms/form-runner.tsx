import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { responsesApi } from "@/services/responses-service";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { FieldRenderer } from "./field-renderer";
import { STATIC_FIELDS, type FormDefinition } from "@/types/forms";

interface Props {
  form: FormDefinition;
  /** when true, submissions are simulated only */
  demo?: boolean;
}

export function FormRunner({ form, demo }: Props) {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const startedAt = useRef(new Date().toISOString());

  const submit = async () => {
    if (!validatePage()) return;
    if (demo) {
      setDone(true);
      return;
    }
    setSending(true);
    try {
      await responsesApi.submit({ form, answers: values, startedAt: startedAt.current });
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  const pages = form.pages;
  const page = pages[pageIndex];
  const progress = useMemo(
    () => Math.round(((pageIndex + 1) / Math.max(pages.length, 1)) * 100),
    [pageIndex, pages.length],
  );

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold">{t("forms.runner.thanksTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("forms.runner.thanksSubtitle")}</p>
          {demo && (
            <Button
              variant="outline"
              onClick={() => {
                setDone(false);
                setPageIndex(0);
                setValues({});
              }}
            >
              {t("forms.runner.restart")}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!page) return null;

  const validatePage = () => {
    const next: Record<string, string> = {};
    for (const field of page.fields) {
      if (STATIC_FIELDS.includes(field.type)) continue;
      const value = values[field.id];
      const empty =
        value === undefined ||
        value === "" ||
        value === false ||
        (Array.isArray(value) && value.length === 0);
      if (field.required && empty) next[field.id] = t("forms.runner.requiredError");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{form.name}</h1>
        {form.description && (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        )}
        {pages.length > 1 && (
          <div className="space-y-1.5 pt-2">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {t("common.page")} {pageIndex + 1}/{pages.length} · {page.title}
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {page.description && (
            <p className="text-sm text-muted-foreground">{page.description}</p>
          )}
          {page.fields.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("forms.runner.emptyPage")}
            </p>
          )}
          {page.fields.map((field) => (
            <div key={field.id}>
              <FieldRenderer
                field={field}
                value={values[field.id]}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
              />
              {errors[field.id] && (
                <p className="mt-1 text-xs text-destructive">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((i) => i - 1)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("forms.runner.back")}
        </Button>
        {pageIndex < pages.length - 1 ? (
          <Button onClick={() => validatePage() && setPageIndex((i) => i + 1)}>
            {t("forms.runner.next")}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => void submit()} disabled={sending}>
            <Send className="mr-1.5 h-4 w-4" />
            {t("forms.runner.submit")}
          </Button>
        )}
      </div>
    </div>
  );
}
