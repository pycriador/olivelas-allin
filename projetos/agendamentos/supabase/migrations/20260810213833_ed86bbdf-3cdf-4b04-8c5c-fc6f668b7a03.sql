REVOKE ALL ON FUNCTION public.appointments_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.appointments_log_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.appointments_guard() TO service_role;
GRANT EXECUTE ON FUNCTION public.appointments_log_status() TO service_role;