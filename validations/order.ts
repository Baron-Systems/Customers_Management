import { z } from "zod";

export const orderSchema = z.object({
  customerId: z.number().min(1, "العميل مطلوب"),
  orderDate: z.string().min(1, "التاريخ مطلوب"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  note: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;
