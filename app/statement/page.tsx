"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { getCustomersWithBalance } from "@/services/customers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, FileText, ArrowLeft, Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerWithBalance {
  id: number;
  name: string;
  phone: string | null;
  currentBalance: number;
}

export default function StatementSelectorPage() {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await getCustomersWithBalance();
    setCustomers(data);
    setLoading(false);
  };

  const filtered = customers.filter((c) => c.name.includes(search));
  const totalDebtors = filtered.filter((c) => c.currentBalance > 0).length;
  const totalBalance = filtered.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">كشف الحساب</h1>
            <p className="text-muted-foreground text-sm mt-1">اختر عميلاً لعرض كشف حسابه التفصيلي</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm border-blue-100 dark:border-blue-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي العملاء</p>
                <p className="text-lg font-bold">{customers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm border-amber-100 dark:border-amber-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">العملاء الدائنون</p>
                <p className="text-lg font-bold">{totalDebtors}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm border-emerald-100 dark:border-emerald-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي الأرصدة</p>
                <p className="text-lg font-bold">{totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن عميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-card shadow-sm"
          />
        </div>

        {/* Customers Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card className="border shadow-sm">
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-lg font-medium mb-1">لا يوجد عملاء</p>
              <p className="text-sm">أضف عميلاً أولاً لعرض كشف حسابه</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((customer) => (
              <Link key={customer.id} href={`/customers/${customer.id}/statement`}>
                <Card className="border shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone || "لا يوجد هاتف"}</p>
                        </div>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">الرصيد الحالي</p>
                      <Badge variant="secondary" className={cn(
                        "text-xs font-bold",
                        customer.currentBalance > 0
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      )}>
                        {customer.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
