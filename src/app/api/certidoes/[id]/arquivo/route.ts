import { NextResponse } from "next/server";
import { assinanteAtual } from "@/src/server/auth/assinante";
import { painelPorEmail } from "@/src/server/db/repositorios/assinante.repo";
import {
  certidaoDoAssinante,
  gravarArquivoChave,
  removerArquivoCertidao,
} from "@/src/server/db/repositorios/certidao.repo";
import {
  apagarPdfCertidao,
  blobConfigurado,
  lerPdfCertidao,
  subirPdfCertidao,
  validarPdf,
} from "@/src/server/certidoes/arquivo";

export const dynamic = "force-dynamic";

async function dono(certidaoId: string) {
  const email = await assinanteAtual();
  if (!email) return null;
  const painel = await painelPorEmail(email);
  if (!painel) return null;
  const c = await certidaoDoAssinante(painel.id, certidaoId);
  if (!c) return null;
  return { assinanteId: painel.id, certidao: c };
}

/** Download autenticado do PDF privado. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const donoOk = await dono(id);
  if (!donoOk) return new NextResponse("Não encontrado", { status: 404 });
  if (!donoOk.certidao.arquivoChave) {
    return new NextResponse("Sem arquivo", { status: 404 });
  }
  if (!blobConfigurado()) {
    return new NextResponse("Storage não configurado", { status: 503 });
  }

  try {
    const arquivo = await lerPdfCertidao(donoOk.certidao.arquivoChave);
    if (!arquivo) return new NextResponse("Arquivo não encontrado", { status: 404 });
    return new NextResponse(arquivo.stream, {
      headers: {
        "Content-Type": arquivo.contentType,
        "Content-Disposition": `attachment; filename="certidao-${donoOk.certidao.tipo}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Falha ao ler o arquivo", { status: 500 });
  }
}

/** Upload de PDF (multipart: campo `arquivo`). */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const donoOk = await dono(id);
  if (!donoOk) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (!blobConfigurado()) {
    return NextResponse.json(
      {
        erro:
          "Upload ainda não está ligado neste ambiente (BLOB_STORE_ID na Vercel ou BLOB_READ_WRITE_TOKEN no local).",
      },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("arquivo");
  if (!(file instanceof File)) {
    return NextResponse.json({ erro: "Envie o campo arquivo (PDF)" }, { status: 400 });
  }

  try {
    const bytes = await validarPdf(file);
    // troca o arquivo antigo, se houver
    if (donoOk.certidao.arquivoChave) {
      await apagarPdfCertidao(donoOk.certidao.arquivoChave);
    }
    const pathname = await subirPdfCertidao(donoOk.assinanteId, id, bytes);
    await gravarArquivoChave(donoOk.assinanteId, id, pathname);
    return NextResponse.json({ ok: true, temArquivo: true });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : "Falha no upload" },
      { status: 400 },
    );
  }
}

/** Remove só o PDF, mantém a data de vencimento. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const donoOk = await dono(id);
  if (!donoOk) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  await removerArquivoCertidao(donoOk.assinanteId, id);
  return NextResponse.json({ ok: true });
}
