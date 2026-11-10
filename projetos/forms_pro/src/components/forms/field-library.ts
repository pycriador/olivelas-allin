import {
  AlignLeft,
  AtSign,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Clock,
  Hash,
  Heading1,
  Link2,
  ListChecks,
  Minus,
  Phone,
  SlidersHorizontal,
  Star,
  Text,
  Type,
  Upload,
} from "lucide-react";
import type { FieldType } from "@/types/forms";

export interface FieldMeta {
  type: FieldType;
  icon: React.ComponentType<{ className?: string }>;
  group: "input" | "choice" | "advanced" | "layout";
}

export const FIELD_META: Record<FieldType, FieldMeta> = {
  short_text: { type: "short_text", icon: Type, group: "input" },
  long_text: { type: "long_text", icon: AlignLeft, group: "input" },
  number: { type: "number", icon: Hash, group: "input" },
  email: { type: "email", icon: AtSign, group: "input" },
  phone: { type: "phone", icon: Phone, group: "input" },
  url: { type: "url", icon: Link2, group: "input" },
  date: { type: "date", icon: Calendar, group: "input" },
  time: { type: "time", icon: Clock, group: "input" },
  checkbox: { type: "checkbox", icon: CheckSquare, group: "choice" },
  radio: { type: "radio", icon: CircleDot, group: "choice" },
  select: { type: "select", icon: ChevronDownSquare, group: "choice" },
  multi_select: { type: "multi_select", icon: ListChecks, group: "choice" },
  scale: { type: "scale", icon: SlidersHorizontal, group: "advanced" },
  rating: { type: "rating", icon: Star, group: "advanced" },
  file: { type: "file", icon: Upload, group: "advanced" },
  heading: { type: "heading", icon: Heading1, group: "layout" },
  paragraph: { type: "paragraph", icon: Text, group: "layout" },
  divider: { type: "divider", icon: Minus, group: "layout" },
};

export const FIELD_GROUPS: { key: FieldMeta["group"]; types: FieldType[] }[] = [
  { key: "input", types: ["short_text", "long_text", "number", "email", "phone", "url", "date", "time"] },
  { key: "choice", types: ["checkbox", "radio", "select", "multi_select"] },
  { key: "advanced", types: ["scale", "rating", "file"] },
  { key: "layout", types: ["heading", "paragraph", "divider"] },
];
