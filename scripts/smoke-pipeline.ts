/**
 * Smoke test manual do pipeline ponta a ponta contra dado real do PNCP.
 * Cria um assinante de teste, roda coleta → casar → alertar → enviar (dry),
 * imprime contagens e um e-mail composto de verdade. NÃO envia (modo dry).
 *
 *   set -a && . ./.env.local && set +a && pnpm tsx scripts/smoke-pipeline.ts
 */
import { db } from "@/src/server/db";
import { assinante, perfilBusca } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";
import { coletarJob } from "@/src/server/coleta/coletar.job";
import { casarJob } from "@/src/server/coleta/casar.job";
import { alertarJob } from "@/src/server/alerta/alertar.job";
import { alertasPendentes } from "@/src/server/db/repositorios/alerta.repo";
import { enviarJob } from "@/src/server/alerta/enviar.job";

const EMAIL_TESTE = "smoke+alimentacao@prefeituraquer.dev";

async function seed() {
  await db.delete(assinante).where(eq(assinante.email, EMAIL_TESTE));
  const [a] = await db
    .insert(assinante)
    .values({ email: EMAIL_TESTE, status: "ativo", nome: "Smoke" })
    .returning({ id: assinante.id });
  await db.insert(perfilBusca).values({
    assinanteId: a!.id,
    uf: "SP",
    municipiosIbge: [], // estado inteiro, para maximizar chance de casar no smoke
    ramos: ["alimentacao", "informatica", "grafica", "limpeza", "manutencao-predial"],
    tetoValorCentavos: 8_000_000n,
    ativo: true,
  });
  process.stdout.write(`assinante de teste criado: ${a!.id}\n`);
}

async function main() {
  process.stdout.write("== seed ==\n");
  await seed();

  process.stdout.write("== coletar (pode levar ~1min) ==\n");
  const c = await coletarJob();
  process.stdout.write(JSON.stringify(c) + "\n");

  process.stdout.write("== casar ==\n");
  const m = await casarJob();
  process.stdout.write(JSON.stringify(m) + "\n");

  process.stdout.write("== alertar ==\n");
  const al = await alertarJob();
  process.stdout.write(JSON.stringify(al) + "\n");

  const pend = await alertasPendentes(3);
  process.stdout.write(`== ${pend.length} alertas pendentes (amostra) ==\n`);
  for (const p of pend) {
    process.stdout.write(
      `  ${p.orgaoRazaoSocial} · ${p.municipioNome} · ${p.ramoSlug} · ${p.itemDescricao.slice(0, 60)}\n`,
    );
  }

  process.stdout.write("== enviar (dry) ==\n");
  const en = await enviarJob();
  process.stdout.write(JSON.stringify(en) + "\n");

  process.exit(0);
}

main().catch((e) => {
  process.stderr.write(`smoke falhou: ${e?.stack ?? e}\n`);
  process.exit(1);
});
