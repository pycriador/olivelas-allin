import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { OrganizationService } from "@/services/organizations";
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LOCALE_OPTIONS,
  TIMEZONE_OPTIONS,
  describeError,
  type Organization,
} from "@/services/types";

export function OrganizationPreferencesForm({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const { canWrite } = usePermissions();
  const editable = canWrite("organization.update");

  const [timezone, setTimezone] = useState(organization.timezone);
  const [locale, setLocale] = useState(organization.locale);
  const [currency, setCurrency] = useState(organization.currency);
  const [dateFormat, setDateFormat] = useState(organization.date_format);

  useEffect(() => {
    setTimezone(organization.timezone);
    setLocale(organization.locale);
    setCurrency(organization.currency);
    setDateFormat(organization.date_format);
  }, [organization]);

  const mutation = useMutation({
    mutationFn: () =>
      OrganizationService.update(organization.id, {
        timezone,
        locale,
        currency,
        date_format: dateFormat,
      }),
    onSuccess: async () => {
      toast.success("Preferências atualizadas.");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferências</CardTitle>
        <CardDescription>Fuso horário, idioma, moeda e formato de data da operação.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Fuso horário</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={!editable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={locale} onValueChange={setLocale} disabled={!editable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Moeda</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={!editable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Formato de data</Label>
            <Select value={dateFormat} onValueChange={setDateFormat} disabled={!editable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {editable ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando…" : "Salvar preferências"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
