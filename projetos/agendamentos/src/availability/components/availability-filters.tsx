import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  useProfessionalsList,
} from "@/shared/hooks/use-agenda-data";
import type { AvailabilityQuery, Modality } from "../dto/types";

export const ANY = "__any__";

export interface FiltersState {
  date: string;
  timeFrom: string;
  timeTo: string;
  durationMinutes: number;
  professionalId: string;
  appointmentTypeId: string;
  clientId: string;
  modality: Modality;
  preferredPeriod: string;
  urgent: boolean;
}

export function defaultFilters(): FiltersState {
  return {
    date: new Date().toISOString().slice(0, 10),
    timeFrom: "",
    timeTo: "",
    durationMinutes: 50,
    professionalId: ANY,
    appointmentTypeId: ANY,
    clientId: ANY,
    modality: "any",
    preferredPeriod: ANY,
    urgent: false,
  };
}

export function toQuery(f: FiltersState): Partial<AvailabilityQuery> {
  return {
    date: f.date,
    timeFrom: f.timeFrom || null,
    timeTo: f.timeTo || null,
    durationMinutes: f.durationMinutes,
    appointmentTypeId: f.appointmentTypeId === ANY ? null : f.appointmentTypeId,
    professionalId: f.professionalId === ANY ? null : f.professionalId,
    clientId: f.clientId === ANY ? null : f.clientId,
    modality: f.modality,
    preferredPeriod:
      f.preferredPeriod === ANY
        ? null
        : (f.preferredPeriod as "morning" | "afternoon" | "evening"),
    urgent: f.urgent,
    limit: 40,
  };
}

export function AvailabilityFilters({
  value,
  onChange,
  onSearch,
  loading,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onSearch: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const pros = useProfessionalsList();
  const types = useAppointmentTypesList();
  const clients = useClientsList();
  const set = <K extends keyof FiltersState>(key: K, v: FiltersState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label>{t("availability.filters.date")}</Label>
          <Input
            type="date"
            value={value.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>{t("availability.filters.from")}</Label>
            <Input
              type="time"
              value={value.timeFrom}
              onChange={(e) => set("timeFrom", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("availability.filters.to")}</Label>
            <Input
              type="time"
              value={value.timeTo}
              onChange={(e) => set("timeTo", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("availability.filters.duration")}</Label>
          <Input
            type="number"
            min={5}
            step={5}
            value={value.durationMinutes}
            onChange={(e) => set("durationMinutes", Number(e.target.value) || 50)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("availability.filters.professional")}</Label>
          <Select
            value={value.professionalId}
            onValueChange={(v) => set("professionalId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("availability.filters.any")}</SelectItem>
              {(pros.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("availability.filters.appointmentType")}</Label>
          <Select
            value={value.appointmentTypeId}
            onValueChange={(v) => {
              const type = (types.data ?? []).find((x) => x.id === v);
              onChange({
                ...value,
                appointmentTypeId: v,
                durationMinutes: type?.duration_minutes ?? value.durationMinutes,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("availability.filters.any")}</SelectItem>
              {(types.data ?? []).map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  {x.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("availability.filters.client")}</Label>
          <Select value={value.clientId} onValueChange={(v) => set("clientId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("availability.filters.any")}</SelectItem>
              {(clients.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("availability.filters.modality")}</Label>
          <Select
            value={value.modality}
            onValueChange={(v) => set("modality", v as Modality)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("availability.filters.any")}</SelectItem>
              <SelectItem value="online">{t("availability.modality.online")}</SelectItem>
              <SelectItem value="in_person">
                {t("availability.modality.inPerson")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("availability.filters.period")}</Label>
          <Select
            value={value.preferredPeriod}
            onValueChange={(v) => set("preferredPeriod", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("availability.filters.any")}</SelectItem>
              <SelectItem value="morning">{t("availability.period.morning")}</SelectItem>
              <SelectItem value="afternoon">
                {t("availability.period.afternoon")}
              </SelectItem>
              <SelectItem value="evening">{t("availability.period.evening")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex items-center gap-2 pb-2">
            <Switch
              id="urgent"
              checked={value.urgent}
              onCheckedChange={(v) => set("urgent", v)}
            />
            <Label htmlFor="urgent">{t("availability.filters.urgent")}</Label>
          </div>
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={onSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {t("availability.search")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
