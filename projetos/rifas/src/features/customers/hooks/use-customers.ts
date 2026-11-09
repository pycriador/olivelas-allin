import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customerService } from "@/services/customer.service";
import type { CustomerFormInput } from "@/schemas/customer.schema";

export interface CustomerListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: ["customers", "list", params],
    queryFn: () => customerService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useCustomerSearch(term: string, enabled = true) {
  return useQuery({
    queryKey: ["customers", "search", term],
    queryFn: () => customerService.search(term, term ? 30 : 5),
    enabled,
    staleTime: 30_000,
  });
}

export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => (customerId ? customerService.getById(customerId) : null),
    enabled: Boolean(customerId),
  });
}

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["customers"] });
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
    void queryClient.invalidateQueries({ queryKey: ["audit"] });
  };
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (input: CustomerFormInput) => customerService.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (input: { customerId: string; data: CustomerFormInput }) =>
      customerService.update(input.customerId, input.data),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (customerId: string) => customerService.softDelete(customerId),
    onSuccess: invalidate,
  });
}

export function useFindByPhone(phone: string) {
  return useQuery({
    queryKey: ["customers", "byPhone", phone],
    queryFn: () => customerService.findByPhone(phone),
    enabled: phone.replace(/\D/g, "").length >= 8,
    staleTime: 30_000,
  });
}
