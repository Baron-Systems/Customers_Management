"use server";

import { getDb } from "@/lib/db";
import { orders, customers } from "@/db/schema";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";

export async function getOrders(filters?: {
  customerId?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}) {
  const db = getDb();
  let query = db
    .select({
      id: orders.id,
      number: orders.number,
      orderDate: orders.orderDate,
      amount: orders.amount,
      note: orders.note,
      createdAt: orders.createdAt,
      customerId: orders.customerId,
      customerName: customers.name,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(orders.orderDate);

  const conditions = [];
  if (filters?.customerId) conditions.push(eq(orders.customerId, filters.customerId));
  if (filters?.fromDate) {
    const fromTimestamp = new Date(filters.fromDate).getTime();
    conditions.push(gte(orders.orderDate, fromTimestamp));
  }
  if (filters?.toDate) {
    const toTimestamp = new Date(filters.toDate).getTime();
    conditions.push(lte(orders.orderDate, toTimestamp));
  }
  if (filters?.search) {
    conditions.push(like(orders.number, `%${filters.search}%`));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.all();
}

export async function getOrderById(id: number) {
  const db = getDb();
  return db.select().from(orders).where(eq(orders.id, id)).get();
}

export async function createOrder(data: {
  customerId: number;
  orderDate: string;
  amount: number;
  note?: string;
}) {
  const db = getDb();
  const lastOrder = db.select({ maxId: sql<number | null>`MAX(${orders.id})` }).from(orders).get();
  const nextId = (lastOrder?.maxId || 0) + 1;
  const nextNumber = `ORD-${String(nextId).padStart(6, "0")}`;

  return db
    .insert(orders)
    .values({
      number: nextNumber,
      customerId: data.customerId,
      orderDate: new Date(data.orderDate).getTime(),
      amount: data.amount,
      note: data.note || null,
    })
    .returning()
    .get();
}

export async function updateOrder(
  id: number,
  data: {
    customerId: number;
    orderDate: string;
    amount: number;
    note?: string;
  }
) {
  const db = getDb();
  return db
    .update(orders)
    .set({
      customerId: data.customerId,
      orderDate: new Date(data.orderDate).getTime(),
      amount: data.amount,
      note: data.note || null,
      updatedAt: Date.now(),
    })
    .where(eq(orders.id, id))
    .returning()
    .get();
}

export async function deleteOrder(id: number) {
  const db = getDb();
  db.delete(orders).where(eq(orders.id, id)).run();
  return { success: true };
}
