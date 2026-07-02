"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET environment variable is required");
}
const secretKey = new TextEncoder().encode(secret);

export async function login(username: string, password: string) {
  try {
    const db = getDb();
    const user = await db.select().from(users).where(eq(users.username, username)).get();

    if (!user) {
      return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
    }

    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secretKey);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Login server error:", error);
    return { success: false, message: error?.message || "حدث خطأ في الخادم" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey, { clockTolerance: 60 });
    return payload as { userId: number; username: string };
  } catch {
    return null;
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session) return { success: false, message: "غير مصرح" };

  const db = getDb();
  const user = await db.select().from(users).where(eq(users.id, session.userId)).get();
  if (!user) return { success: false, message: "المستخدم غير موجود" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { success: false, message: "كلمة المرور الحالية غير صحيحة" };

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash: newHash, updatedAt: Date.now() }).where(eq(users.id, session.userId));

  return { success: true };
}
