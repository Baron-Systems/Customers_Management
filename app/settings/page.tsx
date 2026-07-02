"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/app-layout";
import { getSettings, updateSettings } from "@/services/settings";
import { changePassword } from "@/services/auth";
import { settingsSchema, passwordSchema, type SettingsFormData, type PasswordFormData } from "@/validations/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Store, Lock, Moon, Sun, Monitor, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { shopName: "", phone: "", address: "", logo: "" },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const settings = await getSettings();
    if (settings) {
      settingsForm.reset({
        shopName: settings.shopName,
        phone: settings.phone || "",
        address: settings.address || "",
        logo: settings.logo || "",
      });
    }
    setLoading(false);
  };

  const handleSettingsSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettings(data);
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        passwordForm.reset();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الإعدادات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة إعدادات النظام والمظهر</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : (
          <div className="space-y-6">
            {/* Appearance */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  إعدادات المظهر
                </CardTitle>
                <CardDescription>تخصيص وضع الإضاءة في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:bg-accent",
                      theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input"
                    )}
                  >
                    <Sun className="h-6 w-6 text-amber-500" />
                    <span className="text-sm font-medium">فاتح</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:bg-accent",
                      theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input"
                    )}
                  >
                    <Moon className="h-6 w-6 text-indigo-400" />
                    <span className="text-sm font-medium">داكن</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:bg-accent",
                      theme === "system" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-input"
                    )}
                  >
                    <Monitor className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">تلقائي</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Shop Settings */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  إعدادات المحل
                </CardTitle>
                <CardDescription>معلومات المحل الأساسية</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">اسم المحل *</Label>
                    <Input {...settingsForm.register("shopName")} placeholder="اسم المحل التجاري" />
                    {settingsForm.formState.errors.shopName && (
                      <p className="text-sm text-destructive">{settingsForm.formState.errors.shopName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">رقم الهاتف</Label>
                    <Input {...settingsForm.register("phone")} placeholder="رقم هاتف المحل" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">العنوان</Label>
                    <Input {...settingsForm.register("address")} placeholder="عنوان المحل" />
                  </div>
                  <div className="pt-2">
                    <Button type="submit" className="shadow-sm">حفظ الإعدادات</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Password */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  تغيير كلمة المرور
                </CardTitle>
                <CardDescription>تحديث كلمة المرور لحماية حسابك</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">كلمة المرور الحالية</Label>
                    <Input type="password" {...passwordForm.register("currentPassword")} placeholder="كلمة المرور الحالية" />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">كلمة المرور الجديدة</Label>
                    <Input type="password" {...passwordForm.register("newPassword")} placeholder="كلمة المرور الجديدة" />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">تأكيد كلمة المرور</Label>
                    <Input type="password" {...passwordForm.register("confirmPassword")} placeholder="تأكيد كلمة المرور الجديدة" />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <Button type="submit" className="shadow-sm">تغيير كلمة المرور</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="border shadow-sm bg-muted/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">دفتر الديون</p>
                  <p className="text-xs text-muted-foreground">الإصدار 1.0 · نظام إدارة ديون العملاء</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
