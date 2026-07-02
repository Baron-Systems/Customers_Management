"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/services/auth";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  Moon,
  Sun,
  ChevronRight,
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/orders", label: "الطلبيات", icon: ShoppingCart },
  { href: "/payments", label: "الدفعات", icon: CreditCard },
  { href: "/statement", label: "كشف حساب", icon: ScrollText },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-l bg-card shadow-sm transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-base font-bold leading-tight">دفتر الديون</span>
              <span className="text-[11px] text-muted-foreground leading-tight">نظام إدارة الديون</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg transition-all duration-200 group relative",
                  collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5")} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="mr-auto h-2 w-2 rounded-full bg-primary-foreground/80" />
                )}
                {collapsed && isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-l-md bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t p-3 space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-muted-foreground hover:text-foreground transition-all",
              collapsed ? "justify-center px-2" : "justify-start px-4"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
            {!collapsed && <span className="text-sm font-medium">طي القائمة</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-muted-foreground hover:text-foreground transition-all",
              collapsed ? "justify-center px-2" : "justify-start px-4"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {!collapsed && <span className="text-sm font-medium">{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 text-destructive/90 hover:text-destructive hover:bg-destructive/10 transition-all",
              collapsed ? "justify-center px-2" : "justify-start px-4"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger className="md:hidden fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 shadow-sm bg-card border">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0 bg-card">
          <div className="flex items-center gap-3 p-5 border-b">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight">دفتر الديون</span>
              <span className="text-[11px] text-muted-foreground leading-tight">نظام إدارة الديون</span>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <span className="mr-auto h-2 w-2 rounded-full bg-primary-foreground/80" />}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground px-4"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="text-sm font-medium">{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive/90 hover:text-destructive hover:bg-destructive/10 px-4"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">تسجيل الخروج</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {pathname !== "/dashboard" && pathname !== "/" && (
            <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">الرئيسية</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">{getPageLabel(pathname)}</span>
            </nav>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

function getPageLabel(pathname: string): string {
  const labels: Record<string, string> = {
    "/customers": "العملاء",
    "/orders": "الطلبيات",
    "/payments": "الدفعات",
    "/settings": "الإعدادات",
    "/statement": "كشف حساب",
  };

  if (pathname.startsWith("/customers/") && pathname.includes("/statement")) {
    return "كشف حساب العميل";
  }

  return labels[pathname] || pathname;
}
