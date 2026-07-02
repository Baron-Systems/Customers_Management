import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),
  phone: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.number().min(0, "الرصيد الافتتاحي يجب أن يكون صفر أو أكبر"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
