import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import bcrypt from "bcryptjs";
import * as schema from "@/db/schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (db) return db;

  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const client = new Database(join(dataDir, "app.db"));
  client.pragma("journal_mode = WAL");

  applySchema(client);

  db = drizzle(client, { schema });
  return db;
}

function applySchema(client: Database.Database) {
  const tableExists = client.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (tableExists) return;

  client.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      opening_balance REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      order_date INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      payment_date INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT NOT NULL DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX idx_orders_customer ON orders(customer_id);
    CREATE INDEX idx_orders_date ON orders(order_date);
    CREATE INDEX idx_payments_customer ON payments(customer_id);
    CREATE INDEX idx_payments_date ON payments(payment_date);
  `);

  const passwordHash = bcrypt.hashSync("admin123", 10);
  const now = Date.now();
  client.prepare("INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)").run("admin", passwordHash, now, now);
  client.prepare("INSERT INTO settings (shop_name, phone, address, logo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run("محل تجاري", "", "", "", now, now);
}
