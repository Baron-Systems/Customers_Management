"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Glassmorphism Card */}
        <div className="rounded-2xl border border-white/20 bg-white/70 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl dark:bg-slate-900/60 dark:border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">دفتر الديون</h1>
            <p className="text-sm text-muted-foreground mt-1">نظام متكامل لإدارة ديون العملاء</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  required
                  className="pr-10 bg-white/80 dark:bg-slate-800/60 border-input/60 focus:border-primary/60 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className="pr-10 bg-white/80 dark:bg-slate-800/60 border-input/60 focus:border-primary/60 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          جميع البيانات محمية ومشفرة
        </p>
      </div>
    </div>
  );
}
