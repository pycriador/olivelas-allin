import type { AvailabilityRule, RuleType } from "../dto/types";

/** Rule types the engine knows how to execute, in default execution order. */
export const RULE_ORDER: RuleType[] = [
  "working_hours",
  "interval",
  "lunch",
  "vacation_leave",
  "blocks",
  "holidays",
  "internal_events",
  "google_calendar",
  "recurring_events",
  "min_gap",
  "max_daily",
  "max_weekly",
  "max_appointments",
  "online",
  "in_person",
  "specialty",
  "appointment_type",
  "shared_agenda",
  "overbooking",
];

export class RuleSet {
  private readonly map: Map<RuleType, AvailabilityRule>;

  constructor(rules: AvailabilityRule[]) {
    this.map = new Map(rules.map((r) => [r.type, r]));
  }

  isEnabled(type: RuleType, fallback = true): boolean {
    const rule = this.map.get(type);
    return rule ? rule.enabled : fallback;
  }

  param<T>(type: RuleType, key: string, fallback: T): T {
    const rule = this.map.get(type);
    const value = rule?.params?.[key];
    return value === undefined || value === null ? fallback : (value as T);
  }

  /** Enabled rules sorted by priority then declaration order. */
  ordered(): AvailabilityRule[] {
    return [...this.map.values()]
      .filter((r) => r.enabled)
      .sort(
        (a, b) =>
          a.priority - b.priority ||
          RULE_ORDER.indexOf(a.type) - RULE_ORDER.indexOf(b.type),
      );
  }
}
