import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { hrService } from "@/modules/hr/service";
import type { HRShiftSchedule } from "@/modules/hr/types";

export const Route = createFileRoute("/_app/hr/shifts")({
  head: () => ({ meta: [{ title: "Shift Schedule — ServiceForge" }] }),
  component: ShiftsPage,
});

const DAY_LABELS = ["hr.shift.mon", "hr.shift.tue", "hr.shift.wed", "hr.shift.thu", "hr.shift.fri", "hr.shift.sat", "hr.shift.sun"];

function ShiftsPage() {
  const { t } = useTranslation();
  const [shifts, setShifts] = useState<HRShiftSchedule[]>([]);
  useEffect(() => { hrService.listShifts().then(setShifts); }, []);

  const employees = [...new Set(shifts.map(s => s.employeeName))];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("hr.shifts.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="text-left p-3">{t("hr.shifts.employee")}</th>{DAY_LABELS.map((l, i) => <th key={i} className="text-center p-3">{t(l)}</th>)}</tr></thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp} className="border-t">
                <td className="p-3 font-medium">{emp}</td>
                {DAY_LABELS.map((_, dayIdx) => {
                  const shift = shifts.find(s => s.employeeName === emp && s.dayOfWeek === dayIdx + 1);
                  return <td key={dayIdx} className="p-3 text-center text-xs">{shift?.active ? `${shift.startTime}-${shift.endTime}` : "-"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
