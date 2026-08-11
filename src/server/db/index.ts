/**
 * Conexão Drizzle + postgres-js. Pool único por processo (serverless).
 * server-only: nunca importado pelo cliente.
 */
import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/src/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { _sql?: ReturnType<typeof postgres> };

const sql =
  globalForDb._sql ??
  postgres(env.DATABASE_URL, {
    max: 1, // serverless: uma conexão por instância, o pooler do Neon cuida do resto
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb._sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
