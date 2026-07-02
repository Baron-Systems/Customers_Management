"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { AppLayout } from "@/components/layout/app-layout";
import { getCustomerById, getCustomerOrdersAndPayments } from "@/services/customers";
import { getSettings } from "@/services/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Package, CreditCard, TrendingUp, Landmark, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerData {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  openingBalance: number;
}

interface OrderItem {
  orderDate: number;
  number: string;
  note: string | null;
  amount: number;
}

interface PaymentItem {
  paymentDate: number;
  number: string;
  note: string | null;
  amount: number;
}

interface SettingsData {
  shopName: string;
  phone: string | null;
  address: string | null;
}

interface Transaction {
  type: string;
  date: number;
  number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export default function StatementPage() {
  const params = useParams();
  const customerId = parseInt(params.id as string);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0, balance: 0 });
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef });

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);
  const [rawOrders, setRawOrders] = useState<OrderItem[]>([]);
  const [rawPayments, setRawPayments] = useState<PaymentItem[]>([]);
  const [openingBal, setOpeningBal] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customerData, { orders, payments }, settingsData] = await Promise.all([
        getCustomerById(customerId),
        getCustomerOrdersAndPayments(customerId),
        getSettings(),
      ]);

      setCustomer(customerData ?? null);
      setSettings(settingsData ?? null);
      setRawOrders(orders);
      setRawPayments(payments);
      setOpeningBal(customerData?.openingBalance || 0);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const rebuild = () => {
    const fromTime = fromDate ? new Date(fromDate).getTime() : 0;
    const toTime = toDate ? new Date(toDate).getTime() + 86400000 - 1 : Infinity;

    const txs: Transaction[] = [
      {
        type: "opening",
        date: 0,
        number: "-",
        description: "الرصيد الافتتاحي",
        debit: openingBal,
        credit: 0,
        balance: 0,
      },
      ...rawOrders.map((o) => ({
        type: "order" as const,
        date: o.orderDate,
        number: o.number,
        description: o.note || "طلبية",
        debit: o.amount,
        credit: 0,
        balance: 0,
      })),
      ...rawPayments.map((p) => ({
        type: "payment" as const,
        date: p.paymentDate,
        number: p.number,
        description: p.note || "دفعة",
        debit: 0,
        credit: p.amount,
        balance: 0,
      })),
    ];

    const filtered = txs.filter((t) => {
      if (t.type === "opening") return true;
      return t.date >= fromTime && t.date <= toTime;
    });

    filtered.sort((a, b) => a.date - b.date);

    let runningBalance = 0;
    const rows = filtered.map((t) => {
      runningBalance += t.debit - t.credit;
      return { ...t, balance: runningBalance };
    });

    setTransactions(rows);
    setTotals({
      debit: rows.reduce((sum, t) => sum + t.debit, 0),
      credit: rows.reduce((sum, t) => sum + t.credit, 0),
      balance: runningBalance,
    });
  };

  useEffect(() => {
    if (rawOrders.length > 0 || rawPayments.length > 0 || openingBal !== 0) {
      rebuild();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, rawOrders, rawPayments, openingBal]);

  const formatDate = (date: number) => (date === 0 ? "-" : new Date(date).toLocaleDateString("en-GB"));
  const formatNumber = (num: number) => num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground text-sm">العميل غير موجود</div>
      </AppLayout>
    );
  }

  const ordersCount = transactions.filter((t) => t.type === "order").length;
  const paymentsCount = transactions.filter((t) => t.type === "payment").length;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">كشف حساب العميل</h1>
            <p className="text-muted-foreground text-sm mt-1">كشف حساب احترافي لحركات العميل</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">من</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-auto h-9 text-sm" />
              <span className="text-sm text-muted-foreground">إلى</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-auto h-9 text-sm" />
            </div>
            <Button variant="outline" onClick={handlePrint} className="shadow-sm">
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>

        <div ref={contentRef} className="space-y-8" dir="rtl">
          {/* Shop Header */}
          <div className="text-center pb-6 border-b">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Landmark className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold">{settings?.shopName || "محل تجاري"}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{settings?.phone || ""} {settings?.address ? "· " + settings.address : ""}</p>
          </div>

          {/* Customer Info */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">العميل</p>
            <p className="text-lg font-bold">{customer.name}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-sm border-orange-100 dark:border-orange-900/20">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">إجمالي الطلبيات</p>
                  <p className="text-2xl font-bold">{ordersCount}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                  <Package className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm border-emerald-100 dark:border-emerald-900/20">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">إجمالي الدفعات</p>
                  <p className="text-2xl font-bold">{paymentsCount}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CreditCard className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            <Card className={cn("border shadow-sm", totals.balance > 0 ? "border-amber-100 dark:border-amber-900/20" : "border-emerald-100 dark:border-emerald-900/20")}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">الرصيد الحالي</p>
                  <p className={cn("text-2xl font-bold", totals.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                    {formatNumber(totals.balance)}
                  </p>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", totals.balance > 0 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400")}>
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">سجل الحركات</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider">التاريخ</th>
                    <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider">النوع</th>
                    <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider">الرقم</th>
                    <th className="p-4 text-right font-semibold text-xs uppercase tracking-wider">البيان</th>
                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">مدين</th>
                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">دائن</th>
                    <th className="p-4 text-left font-semibold text-xs uppercase tracking-wider">الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-muted-foreground text-sm">{formatDate(t.date)}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={cn(
                          "text-xs font-medium",
                          t.type === "order" && "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
                          t.type === "payment" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
                          t.type === "opening" && "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        )}>
                          {t.type === "opening" ? "رصيد افتتاحي" : t.type === "order" ? "طلبية" : "دفعة"}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium text-sm">{t.number}</td>
                      <td className="p-4 text-muted-foreground text-sm">{t.description}</td>
                      <td className="p-4 text-left font-medium text-sm text-orange-600 dark:text-orange-400">
                        {t.debit > 0 ? formatNumber(t.debit) : "-"}
                      </td>
                      <td className="p-4 text-left font-medium text-sm text-emerald-600 dark:text-emerald-400">
                        {t.credit > 0 ? formatNumber(t.credit) : "-"}
                      </td>
                      <td className="p-4 text-left font-bold text-sm">{formatNumber(t.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Totals Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-sm bg-orange-50/30 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium mb-1">إجمالي المدين</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatNumber(totals.debit)}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium mb-1">إجمالي الدائن</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(totals.credit)}</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-primary/5 border-primary/10">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium mb-1">الرصيد النهائي</p>
                <p className="text-xl font-bold text-primary">{formatNumber(totals.balance)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
