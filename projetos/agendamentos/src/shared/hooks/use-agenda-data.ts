import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "./use-tenant-id";

export function useProfessionalsList() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ["professionals", tenantId, "list"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, full_name, agenda_color, active, default_session_minutes")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClientsList() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ["clients", tenantId, "list"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, status")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAppointmentTypesList() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ["appointment_types", tenantId, "list"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_types")
        .select("id, name, color, duration_minutes, active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
