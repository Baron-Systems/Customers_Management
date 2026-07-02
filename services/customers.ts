"use server";

import { getDb } from "@/lib/db";
import { customers, orders, payments } from "@/db/schema";
import { eq, like, sql } from "drizzle-orm";

export async function getCustomers(search?: string) {
  const db = getDb();
  let query = db.select().from(customers).orderBy(customers.name);
  if (search) {
    query = db.select().from(customers).where(like(customers.name, `%${search}%`)).orderBy(customers.name) as typeof query;
  }
  return query.all();
}

export async function getCustomersWithBalance(search?: string) {
  const db = getDb();
  let allCustomers = db.select().from(customers).orderBy(customers.name).all();
  if (search) {
    allCustomers = allCustomers.filter((c) => c.name.includes(search));
  }

  const ordersTotals = db
    .select({ customerId: orders.customerId, total: sql<number>`SUM(${orders.amount})` })
    .from(orders)
    .groupBy(orders.customerId)
    .all();

  const paymentsTotals = db
    .select({ customerId: payments.customerId, total: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .groupBy(payments.customerId)
    .all();

  const ordersMap = new Map(ordersTotals.map((o) => [o.customerId, o.total || 0]));
  const paymentsMap = new Map(paymentsTotals.map((p) => [p.customerId, p.total || 0]));

  return allCustomers.map((customer) => ({
    ...customer,
    currentBalance:
      customer.openingBalance +
      (ordersMap.get(customer.id) || 0) -
      (paymentsMap.get(customer.id) || 0),
  }));
}

export async function getCustomerById(id: number) {
  const db = getDb();
  return db.select().from(customers).where(eq(customers.id, id)).get();
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  address?: string;
  openingBalance?: number;
}) {
  const db = getDb();
  return db
    .insert(customers)
    .values({
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      openingBalance: data.openingBalance || 0,
    })
    .returning()
    .get();
}

export async function updateCustomer(
  id: number,
  data: {
    name: string;
    phone?: string;
    address?: string;
    openingBalance?: number;
  }
) {
  const db = getDb();
  return db
    .update(customers)
    .set({
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      openingBalance: data.openingBalance || 0,
      updatedAt: Date.now(),
    })
    .where(eq(customers.id, id))
    .returning()
    .get();
}

export async function deleteCustomer(id: number) {
  const db = getDb();
  const orderCount = db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(eq(orders.customerId, id)).get();
  const paymentCount = db.select({ count: sql<number>`COUNT(*)` }).from(payments).where(eq(payments.customerId, id)).get();

  if ((orderCount?.count || 0) > 0 || (paymentCount?.count || 0) > 0) {
    return { success: false, message: "لا يمكن حذف عميل لديه طلبيات أو دفعات" };
  }

  db.delete(customers).where(eq(customers.id, id)).run();
  return { success: true };
}

export async function getCustomerOrdersAndPayments(customerId: number) {
  const db = getDb();
  const customerOrders = db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(orders.orderDate)
    .all();
  const customerPayments = db
    .select()
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .orderBy(payments.paymentDate)
    .all();
  return { orders: customerOrders, payments: customerPayments };
}
