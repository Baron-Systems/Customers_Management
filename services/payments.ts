"use server";

import { getDb } from "@/lib/db";
import { payments, customers } from "@/db/schema";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";

export async function getPayments(filters?: {
  customerId?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}) {
  const db = getDb();
  let query = db
    .select({
      id: payments.id,
      number: payments.number,
      paymentDate: payments.paymentDate,
      amount: payments.amount,
      note: payments.note,
      createdAt: payments.createdAt,
      customerId: payments.customerId,
      customerName: customers.name,
    })
    .from(payments)
    .leftJoin(customers, eq(payments.customerId, customers.id))
    .orderBy(payments.paymentDate);

  const conditions = [];
  if (filters?.customerId) conditions.push(eq(payments.customerId, filters.customerId));
  if (filters?.fromDate) {
    const fromTimestamp = new Date(filters.fromDate).getTime();
    conditions.push(gte(payments.paymentDate, fromTimestamp));
  }
  if (filters?.toDate) {
    const toTimestamp = new Date(filters.toDate).getTime();
    conditions.push(lte(payments.paymentDate, toTimestamp));
  }
  if (filters?.search) {
    conditions.push(like(payments.number, `%${filters.search}%`));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.all();
}

export async function getPaymentById(id: number) {
  const db = getDb();
  return db.select().from(payments).where(eq(payments.id, id)).get();
}

export async function createPayment(data: {
  customerId: number;
  paymentDate: string;
  amount: number;
  note?: string;
}) {
  const db = getDb();
  const lastPayment = db.select({ maxId: sql<number | null>`MAX(${payments.id})` }).from(payments).get();
  const nextId = (lastPayment?.maxId || 0) + 1;
  const nextNumber = `PAY-${String(nextId).padStart(6, "0")}`;

  return db
    .insert(payments)
    .values({
      number: nextNumber,
      customerId: data.customerId,
      paymentDate: new Date(data.paymentDate).getTime(),
      amount: data.amount,
      note: data.note || null,
    })
    .returning()
    .get();
}

export async function updatePayment(
  id: number,
  data: {
    customerId: number;
    paymentDate: string;
    amount: number;
    note?: string;
  }
) {
  const db = getDb();
  return db
    .update(payments)
    .set({
      customerId: data.customerId,
      paymentDate: new Date(data.paymentDate).getTime(),
      amount: data.amount,
      note: data.note || null,
      updatedAt: Date.now(),
    })
    .where(eq(payments.id, id))
    .returning()
    .get();
}

export async function deletePayment(id: number) {
  const db = getDb();
  db.delete(payments).where(eq(payments.id, id)).run();
  return { success: true };
}
