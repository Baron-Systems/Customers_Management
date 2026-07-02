import { z } from "zod";

export const settingsSchema = z.object({
  shopName: z.string().min(1, "اسم المحل مطلوب"),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
