"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/app-layout";
import { getPayments, createPayment, updatePayment, deletePayment } from "@/services/payments";
import { getCustomers } from "@/services/customers";
import { paymentSchema, type PaymentFormData } from "@/validations/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, CreditCard, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentWithCustomer {
  id: number;
  number: string;
  paymentDate: number;
  amount: number;
  note: string | null;
  customerId: number;
  customerName: string | null;
}

interface CustomerOption {
  id: number;
  name: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithCustomer[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const addForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { customerId: 0, paymentDate: new Date().toISOString().split("T")[0], amount: 0, note: "" },
  });

  const editForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { customerId: 0, paymentDate: "", amount: 0, note: "" },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadCustomers();
    loadPayments();
  }, []);

  const loadCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data.map((c) => ({ id: c.id, name: c.name })));
  };

  const loadPayments = async () => {
    setLoading(true);
    const data = await getPayments({
      customerId: customerFilter ? parseInt(customerFilter) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      search: search || undefined,
    });
    setPayments(data as PaymentWithCustomer[]);
    setPage(1);
    setLoading(false);
  };

  const handleAdd = async (data: PaymentFormData) => {
    try {
      await createPayment(data);
      toast.success("تم إضافة الدفعة بنجاح");
      setIsAddOpen(false);
      addForm.reset({ customerId: 0, paymentDate: new Date().toISOString().split("T")[0], amount: 0, note: "" });
      loadPayments();
    } catch {
      toast.error("حدث خطأ أثناء إضافة الدفعة");
    }
  };

  const handleEdit = async (data: PaymentFormData) => {
    if (!selectedPayment) return;
    try {
      await updatePayment(selectedPayment.id, data);
      toast.success("تم تعديل الدفعة بنجاح");
      setIsEditOpen(false);
      setSelectedPayment(null);
      loadPayments();
    } catch {
      toast.error("حدث خطأ أثناء تعديل الدفعة");
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    try {
      await deletePayment(selectedPayment.id);
      toast.success("تم حذف الدفعة بنجاح");
      setIsDeleteOpen(false);
      setSelectedPayment(null);
      loadPayments();
    } catch {
      toast.error("حدث خطأ أثناء حذف الدفعة");
    }
  };

  const openEdit = (payment: PaymentWithCustomer) => {
    setSelectedPayment(payment);
    editForm.reset({
      customerId: payment.customerId,
      paymentDate: new Date(payment.paymentDate).toISOString().split("T")[0],
      amount: payment.amount,
      note: payment.note || "",
    });
    setIsEditOpen(true);
  };

  const openDelete = (payment: PaymentWithCustomer) => {
    setSelectedPayment(payment);
    setIsDeleteOpen(true);
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString("en-GB");

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الدفعات</h1>
            <p className="text-muted-foreground text-sm mt-1">إدارة دفعات العملاء والتحصيل</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="shadow-sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة دفعة
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm border-emerald-100 dark:border-emerald-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي الدفعات</p>
                <p className="text-lg font-bold">{payments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm border-blue-100 dark:border-blue-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">إجمالي المبالغ</p>
                <p className="text-lg font-bold">{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث برقم الدفعة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="border rounded-lg px-3 py-2 min-w-[160px] bg-background text-sm h-10">
              <option value="">كل العملاء</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="min-w-[150px] text-sm" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="min-w-[150px] text-sm" />
            <Button variant="outline" onClick={loadPayments} className="min-w-[80px]">تطبيق</Button>
          </div>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : payments.length === 0 ? (
          <Card className="border shadow-sm">
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-lg font-medium mb-1">لا توجد دفعات</p>
              <p className="text-sm">اضغط على &quot;إضافة دفعة&quot; لإضافة دفعة جديدة</p>
            </div>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-right font-semibold">رقم الدفعة</TableHead>
                    <TableHead className="text-right font-semibold">العميل</TableHead>
                    <TableHead className="text-right font-semibold">التاريخ</TableHead>
                    <TableHead className="text-right font-semibold">المبلغ</TableHead>
                    <TableHead className="text-right font-semibold">الملاحظة</TableHead>
                    <TableHead className="text-left font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice((page - 1) * pageSize, page * pageSize).map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-sm">{payment.number}</TableCell>
                      <TableCell className="text-sm">{payment.customerName || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{payment.note || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" title="تعديل" onClick={() => openEdit(payment)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" title="حذف" onClick={() => openDelete(payment)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {payments.length > pageSize && (
              <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                <span className="text-sm text-muted-foreground">
                  عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, payments.length)} من {payments.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                  <span className="text-sm text-muted-foreground">صفحة {page} من {Math.ceil(payments.length / pageSize)}</span>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(payments.length / pageSize)} onClick={() => setPage(p => p + 1)}>التالي</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">إضافة دفعة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">العميل *</Label>
              <select {...addForm.register("customerId", { valueAsNumber: true })} className="w-full border rounded-lg px-3 py-2 bg-background text-sm h-10">
                <option value="0">اختر العميل</option>
                {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              {addForm.formState.errors.customerId && <p className="text-sm text-destructive">{addForm.formState.errors.customerId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ *</Label>
              <Input type="date" {...addForm.register("paymentDate")} />
              {addForm.formState.errors.paymentDate && <p className="text-sm text-destructive">{addForm.formState.errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">المبلغ *</Label>
              <Input type="number" step="0.01" {...addForm.register("amount", { valueAsNumber: true })} />
              {addForm.formState.errors.amount && <p className="text-sm text-destructive">{addForm.formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الملاحظة</Label>
              <Input {...addForm.register("note")} placeholder="ملاحظات إضافية..." />
            </div>
            <Button type="submit" className="w-full">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">تعديل دفعة</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">العميل *</Label>
              <select {...editForm.register("customerId", { valueAsNumber: true })} className="w-full border rounded-lg px-3 py-2 bg-background text-sm h-10">
                <option value="0">اختر العميل</option>
                {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              {editForm.formState.errors.customerId && <p className="text-sm text-destructive">{editForm.formState.errors.customerId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">التاريخ *</Label>
              <Input type="date" {...editForm.register("paymentDate")} />
              {editForm.formState.errors.paymentDate && <p className="text-sm text-destructive">{editForm.formState.errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">المبلغ *</Label>
              <Input type="number" step="0.01" {...editForm.register("amount", { valueAsNumber: true })} />
              {editForm.formState.errors.amount && <p className="text-sm text-destructive">{editForm.formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">الملاحظة</Label>
              <Input {...editForm.register("note")} placeholder="ملاحظات إضافية..." />
            </div>
            <Button type="submit" className="w-full">حفظ</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">هل أنت متأكد من حذف الدفعة &quot;{selectedPayment?.number}&quot;؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
