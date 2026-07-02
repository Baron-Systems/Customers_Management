"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/app-layout";
import { getCustomersWithBalance, createCustomer, updateCustomer, deleteCustomer } from "@/services/customers";
import { customerSchema, type CustomerFormData } from "@/validations/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, FileText, Search, Users, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CustomerWithBalance {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  openingBalance: number;
  currentBalance: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const addForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", address: "", openingBalance: 0 },
  });

  const editForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", address: "", openingBalance: 0 },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await getCustomersWithBalance(search);
    setCustomers(data);
    setPage(1);
    setLoading(false);
  };

  const handleSearch = async (value: string) => {
    setSearch(value);
    setLoading(true);
    const data = await getCustomersWithBalance(value);
    setCustomers(data);
    setPage(1);
    setLoading(false);
  };

  const handleAdd = async (data: CustomerFormData) => {
    try {
      await createCustomer(data);
      toast.success("تم إضافة العميل بنجاح");
      setIsAddOpen(false);
      addForm.reset();
      loadCustomers();
    } catch {
      toast.error("حدث خطأ أثناء إضافة العميل");
    }
  };

  const handleEdit = async (data: CustomerFormData) => {
    if (!selectedCustomer) return;
    try {
      await updateCustomer(selectedCustomer.id, data);
      toast.success("تم تعديل العميل بنجاح");
      setIsEditOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch {
      toast.error("حدث خطأ أثناء تعديل العميل");
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      const result = await deleteCustomer(selectedCustomer.id);
      if (result.success) {
        toast.success("تم حذف العميل بنجاح");
        setIsDeleteOpen(false);
        setSelectedCustomer(null);
        loadCustomers();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("حدث خطأ أثناء حذف العميل");
    }
  };

  const openEdit = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    editForm.reset({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      openingBalance: customer.openingBalance,
    });
    setIsEditOpen(true);
  };

  const openDelete = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  const totalDebtors = customers.filter((c) => c.currentBalance > 0).length;
  const totalBalance = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  const stats = [
    {
      title: "إجمالي العملاء",
      value: customers.length,
      icon: Users,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/20",
    },
    {
      title: "العملاء الدائنون",
      value: totalDebtors,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/20",
    },
    {
      title: "إجمالي الأرصدة",
      value: totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
      border: "border-emerald-100 dark:border-emerald-900/20",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">العملاء</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة بيانات العملاء وأرصدتهم</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="shadow-sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة عميل
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className={cn("border shadow-sm", stat.border)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن عميل..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10 bg-card shadow-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <Card className="border shadow-sm">
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-lg font-medium mb-1">لا يوجد عملاء</p>
              <p className="text-sm">اضغط على &quot;إضافة عميل&quot; لإضافة عميل جديد</p>
            </div>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right font-semibold">الاسم</TableHead>
                    <TableHead className="text-right font-semibold">الهاتف</TableHead>
                    <TableHead className="text-right font-semibold">الدين السابق</TableHead>
                    <TableHead className="text-right font-semibold">المتبقي</TableHead>
                    <TableHead className="text-left font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.slice((page - 1) * pageSize, page * pageSize).map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{customer.phone || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{customer.openingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                          customer.currentBalance > 0
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        )}>
                          {customer.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/customers/${customer.id}/statement`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" title="كشف حساب">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" title="تعديل" onClick={() => openEdit(customer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="حذف" onClick={() => openDelete(customer)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {customers.length > pageSize && (
              <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, customers.length)} من {customers.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                  <span className="text-sm text-muted-foreground">صفحة {page} من {Math.ceil(customers.length / pageSize)}</span>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(customers.length / pageSize)} onClick={() => setPage(p => p + 1)}>التالي</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">الاسم *</Label>
              <Input {...addForm.register("name")} placeholder="اسم العميل" />
              {addForm.formState.errors.name && (
                <p className="text-sm text-destructive">{addForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الهاتف</Label>
              <Input {...addForm.register("phone")} placeholder="رقم الهاتف" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">العنوان</Label>
              <Input {...addForm.register("address")} placeholder="عنوان العميل" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الرصيد الافتتاحي</Label>
              <Input type="number" step="0.01" {...addForm.register("openingBalance", { valueAsNumber: true })} />
              {addForm.formState.errors.openingBalance && (
                <p className="text-sm text-destructive">{addForm.formState.errors.openingBalance.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">تعديل عميل</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">الاسم *</Label>
              <Input {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الهاتف</Label>
              <Input {...editForm.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">العنوان</Label>
              <Input {...editForm.register("address")} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الرصيد الافتتاحي</Label>
              <Input type="number" step="0.01" {...editForm.register("openingBalance", { valueAsNumber: true })} />
              {editForm.formState.errors.openingBalance && (
                <p className="text-sm text-destructive">{editForm.formState.errors.openingBalance.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">هل أنت متأكد من حذف العميل &quot;{selectedCustomer?.name}&quot;؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
