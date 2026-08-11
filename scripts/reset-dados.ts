import { db } from "@/src/server/db";
import { sql } from "drizzle-orm";
await db.execute(sql`truncate table alerta, classificacao_item, item_contratacao, contratacao, cursor_coleta, execucao_coleta restart identity cascade`);
process.stdout.write("dados de coleta zerados\n");
process.exit(0);
