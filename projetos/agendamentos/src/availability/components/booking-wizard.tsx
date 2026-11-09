import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAppointmentTypesList,
  useClientsList,
} from "@/shared/hooks/use-agenda-data";

import {
  AvailabilityFilters,
  ANY,
  defaultFilters,
  toQuery,
  type FiltersState,
} from "./availability-filters";
import { SuggestionList } from "./suggestion-list";
import { searchAvailabilityFn } from "../services/availability.functions";
import { bookAppointmentFn, validateBookingFn } from "../services/booking.functions";
import type { SlotSuggestion } from "../dto/types";

type Step = 1 | 2 | 3;

export interface BookingWizardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialFilters?: FiltersState | null;
  initialSlot?: SlotSuggestion | null;
  onBooked?: () => void;
}

export function BookingWizard({
  open,
  onOpenChange,
  initialFilters,
  initialSlot,
  onBooked,
}: BookingWizardProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const clients = useClientsList();
  const types = useAppointmentTypesList();

  const [step, setStep] = useState<Step>(1);
  const [filters, setFilters] = useState<FiltersState>(initialFilters ?? defaultFilters());
  const [suggestions, setSuggestions] = useState<SlotSuggestion[]>([]);
  const [slot, setSlot] = useState<SlotSuggestion | null>(null);
  const [clientId, setClientId] = useState<string>(ANY);
  const [appointmentTypeId, setAppointmentTypeId] = useState<string>(ANY);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allowOverbooking, setAllowOverbooking] = useState(false);

  // Pre-fill everything from the entry point (filters + optional chosen slot).
  useEffect(() => {
    if (!open) return;
    const base = initialFilters ?? defaultFilters();
    setFilters(base);
    setClientId(base.clientId);
    setAppointmentTypeId(base.appointmentTypeId);
    setDescription("");
    setAllowOverbooking(false);
    if (initialSlot) {
      setSlot(initialSlot);
      setSuggestions([initialSlot]);
      setTitle(`${initialSlot.professionalName} · ${initialSlot.startLabel}`);
      setStep(3);
    } else {
      setSlot(null);
      setSuggestions([]);
      setTitle("");
      setStep(1);
    }
  }, [open, initialFilters, initialSlot]);

  const search = useMutation({
    mutationFn: (f: FiltersState) => searchAvailabilityFn({ data: toQuery(f) }),
    onSuccess: (res) => {
      setSuggestions(res.suggestions as SlotSuggestion[]);
      setStep(2);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payload = useMemo(() => {
    if (!slot) return null;
    return {
      date: filters.date,
      professionalId: slot.professionalId,
      clientId: clientId === ANY ? null : clientId,
      appointmentTypeId: appointmentTypeId === ANY ? null : appointmentTypeId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      title: title || `${slot.professionalName} · ${slot.startLabel}`,
      description: description || null,
      modality: filters.modality,
      allowOverbooking,
    };
  }, [slot, filters, clientId, appointmentTypeId, title, description, allowOverbooking]);

  const validation = useQuery({
    queryKey: ["booking", "validate", payload],
    enabled: step === 3 && !!payload,
    queryFn: () => validateBookingFn({ data: payload! }),
  });

  const book = useMutation({
    mutationFn: () => bookAppointmentFn({ data: payload! }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(t("availability.wizard.conflictBlocked"));
        validation.refetch();
        return;
      }
      toast.success(t("availability.wizard.booked"));
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
      onBooked?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const chooseSlot = (s: SlotSuggestion) => {
    setSlot(s);
    setTitle(`${s.professionalName} · ${s.startLabel}`);
    setStep(3);
  };

  const issues = validation.data?.issues ?? [];
  const blocking = issues.filter((i) => i.severity === "error");
  const hasConflicts = blocking.some((i) => i.code.endsWith("Conflict"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("availability.wizard.title")}</DialogTitle>
          <DialogDescription>
            {t(`availability.wizard.step${step}Desc`)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`flex-1 rounded-full px-3 py-1 text-center ${
                n === step
                  ? "bg-primary text-primary-foreground"
                  : n < step
                    ? "bg-primary/15 text-primary"
                    : "bg-muted"
              }`}
            >
              {n}. {t(`availability.wizard.step${n}`)}
            </span>
          ))}
        </div>

        {step === 1 && (
          <AvailabilityFilters
            value={filters}
            onChange={setFilters}
            onSearch={() => search.mutate(filters)}
            loading={search.isPending}
          />
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {suggestions.length} {t("availability.resultsIn")} {search.data?.durationMs} ms
            </p>
            <SuggestionList
              suggestions={suggestions}
              loading={search.isPending}
              onSchedule={chooseSlot}
            />
          </div>
        )}

        {step === 3 && slot && (
          <div className="space-y-4">
            <Card className="flex flex-wrap items-center gap-4 p-4">
              <span
                className="h-10 w-1.5 rounded-full"
                style={{ backgroundColor: slot.professionalColor }}
              />
              <div>
                <p className="font-medium">{slot.professionalName}</p>
                <p className="text-sm text-muted-foreground">
                  {filters.date} · {slot.startLabel} – {slot.endLabel}
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {t("availability.workload")}: {slot.workloadPercent}%
              </Badge>
            </Card>

            <div className="rounded-md border p-3 text-sm">
              {validation.isFetching ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("availability.wizard.validating")}
                </span>
              ) : issues.length === 0 ? (
                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("availability.wizard.noConflicts")}
                </span>
              ) : (
                <ul className="space-y-1">
                  {issues.map((i, idx) => (
                    <li
                      key={`${i.code}-${idx}`}
                      className={`flex items-start gap-2 ${
                        i.severity === "error"
                          ? "text-destructive"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {t(`availability.wizard.issues.${i.code}`, i.code)}
                        {i.detail ? ` — ${i.detail}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("availability.filters.client")}</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>—</SelectItem>
                    {(clients.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("availability.filters.appointmentType")}</Label>
                <Select value={appointmentTypeId} onValueChange={setAppointmentTypeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>—</SelectItem>
                    {(types.data ?? []).map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("events.fields.title")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("events.fields.description")}</Label>
              <Textarea
                rows={3}
                value={description}
                maxLength={2000}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {hasConflicts && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 p-3">
                <Switch
                  id="overbooking"
                  checked={allowOverbooking}
                  onCheckedChange={setAllowOverbooking}
                />
                <Label htmlFor="overbooking" className="text-sm">
                  {t("availability.wizard.forceOverbooking")}
                </Label>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep((step - 1) as Step))}
          >
            {step === 1 ? (
              t("common.cancel")
            ) : (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("availability.wizard.back")}
              </>
            )}
          </Button>

          {step === 1 && (
            <Button onClick={() => search.mutate(filters)} disabled={search.isPending}>
              {search.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {t("availability.search")}
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={() => book.mutate()}
              disabled={
                book.isPending ||
                validation.isFetching ||
                !payload ||
                validation.data?.ok === false
              }
            >
              {book.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck className="mr-2 h-4 w-4" />
              )}
              {t("availability.wizard.confirm")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
