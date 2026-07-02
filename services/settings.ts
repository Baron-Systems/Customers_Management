"use server";

import { getDb } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSettings() {
  const db = getDb();
  return db.select().from(settings).get();
}

export async function updateSettings(data: {
  shopName: string;
  phone?: string;
  address?: string;
  logo?: string;
}) {
  const db = getDb();
  const existing = await getSettings();
  if (existing) {
    return db
      .update(settings)
      .set({
        shopName: data.shopName,
        phone: data.phone || null,
        address: data.address || null,
        logo: data.logo || null,
        updatedAt: Date.now(),
      })
      .where(eq(settings.id, existing.id))
      .returning()
      .get();
  }
  return db.insert(settings).values({
    shopName: data.shopName,
    phone: data.phone || null,
    address: data.address || null,
    logo: data.logo || null,
  }).returning().get();
}
