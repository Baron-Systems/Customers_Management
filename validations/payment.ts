import { z } from "zod";

export const paymentSchema = z.object({
  customerId: z.number().min(1, "العميل مطلوب"),
  paymentDate: z.string().min(1, "التاريخ مطلوب"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  note: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
