import { z } from "zod";

import { ORDER_STATUS_VALUES, PAYMENT_METHOD_VALUES } from "@/types/order";

export const orderStatusSchema = z.object({
  orderId: z.string().uuid("Pedido inválido"),
  status: z.enum(ORDER_STATUS_VALUES as unknown as [string, ...string[]]),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;

export const paymentMethodSchema = z
  .enum(PAYMENT_METHOD_VALUES as unknown as [string, ...string[]])
  .nullable()
  .optional();

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
