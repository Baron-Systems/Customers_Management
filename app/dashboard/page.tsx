import { AppLayout } from "@/components/layout/app-layout";
import { getCustomersWithBalance } from "@/services/customers";
import { getOrders } from "@/services/orders";
import { getPayments } from "@/services/payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, ShoppingCart, CreditCard, ArrowUpLeft, ArrowDownRight } from "lucide-react";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-GB");
}

function formatNumber(num: number) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const customers = await getCustomersWithBalance();
  const orders = await getOrders();
  const payments = await getPayments();

  const totalCustomers = customers.length;
  const totalDebts = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
  const totalOrders = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  const recentOrders = [...orders].reverse().slice(0, 6);
  const recentPayments = [...payments].reverse().slice(0, 6);

  const stats = [
    {
      title: "عدد العملاء",
      value: totalCustomers,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
      borderColor: "border-blue-100 dark:border-blue-900/30",
      change: "+12%",
      changeUp: true,
    },
    {
      title: "إجمالي الديون",
      value: formatNumber(totalDebts),
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
      borderColor: "border-amber-100 dark:border-amber-900/30",
      change: "+5%",
      changeUp: false,
    },
    {
      title: "إجمالي الطلبيات",
      value: formatNumber(totalOrders),
      icon: ShoppingCart,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400",
      borderColor: "border-orange-100 dark:border-orange-900/30",
      change: "+18%",
      changeUp: true,
    },
    {
      title: "إجمالي الدفعات",
      value: formatNumber(totalPayments),
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
      change: "+8%",
      changeUp: true,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm mt-1">نظرة عامة على أداء نشاطك التجاري</p>
          </div>
          <div className="text-sm text-muted-foreground bg-card border rounded-lg px-4 py-2">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className={`border shadow-sm hover:shadow-md transition-shadow ${stat.borderColor}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {stat.changeUp ? (
                          <ArrowUpLeft className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className={stat.changeUp ? "text-emerald-600" : "text-amber-600"}>
                          {stat.change}
                        </span>
                        <span className="text-muted-foreground">من الشهر الماضي</span>
                      </div>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">آخر الطلبيات</CardTitle>
                <Badge variant="secondary" className="text-xs">{orders.length} إجمالي</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="text-muted-foreground text-center py-10 text-sm">لا توجد طلبيات</div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{order.number}</div>
                          <div className="text-xs text-muted-foreground">{order.customerName} · {formatDate(order.orderDate)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatNumber(order.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">آخر الدفعات</CardTitle>
                <Badge variant="secondary" className="text-xs">{payments.length} إجمالي</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentPayments.length === 0 ? (
                <div className="text-muted-foreground text-center py-10 text-sm">لا توجد دفعات</div>
              ) : (
                <div className="divide-y">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{payment.number}</div>
                          <div className="text-xs text-muted-foreground">{payment.customerName} · {formatDate(payment.paymentDate)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(payment.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
