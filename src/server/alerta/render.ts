/**
 * EmailAlerta → HTML e texto. Puro. HTML simples, sem imagem pesada, decidível
 * no celular. Ver alertas-e-envio.md.
 */
import type { EmailAlerta } from "./compor";
import type { EmailResumo } from "./compor-resumo";

export function renderTexto(e: EmailAlerta): string {
  const partes = [
    e.titulo,
    "",
    ...e.linhas,
    ...(e.avisoEscala ? ["", e.avisoEscala] : []),
    "",
    e.prazo,
    "",
    `Ver o edital: ${e.verEditalUrl}`,
    `Como enviar minha proposta: ${e.comoParticiparUrl}`,
    "",
    e.porque,
    ...(e.naoEraPraMimUrl ? ["", `Não era pra mim: ${e.naoEraPraMimUrl}`] : []),
  ];
  return partes.join("\n");
}

export function renderHtml(e: EmailAlerta): string {
  const linhas = e.linhas.map((l) => `<p style="margin:.15rem 0">${escapar(l)}</p>`).join("");
  const escala = e.avisoEscala
    ? `<p style="margin:.75rem 0;color:#8a5a00;background:#fff6e5;padding:.6rem .8rem;border-radius:8px">${escapar(e.avisoEscala)}</p>`
    : "";
  return `<!doctype html><html lang="pt-BR"><body style="font-family:system-ui,Arial,sans-serif;color:#1b1a17;max-width:520px;margin:0 auto;padding:1.5rem;line-height:1.5">
    <h1 style="font-size:1.25rem;margin:0 0 1rem">${escapar(e.titulo)}</h1>
    ${linhas}
    ${escala}
    <p style="margin:1rem 0;font-weight:600">${escapar(e.prazo)}</p>
    <p style="margin:1.25rem 0">
      <a href="${escapar(e.verEditalUrl)}" style="background:#1f6f43;color:#fff;padding:.7rem 1.1rem;border-radius:8px;text-decoration:none;display:inline-block">Ver o edital</a>
      &nbsp;
      <a href="${escapar(e.comoParticiparUrl)}" style="color:#1f6f43;padding:.7rem .4rem;text-decoration:none;display:inline-block">Como enviar minha proposta</a>
    </p>
    <hr style="border:0;border-top:1px solid #e7e4dc;margin:1.5rem 0" />
    <p style="color:#6b6a63;font-size:.85rem">${escapar(e.porque)}</p>
    ${
      e.naoEraPraMimUrl
        ? `<p style="color:#6b6a63;font-size:.8rem;margin-top:.5rem"><a href="${escapar(e.naoEraPraMimUrl)}" style="color:#6b6a63">Não era pra mim</a></p>`
        : ""
    }
  </body></html>`;
}

export function renderResumoTexto(e: EmailResumo): string {
  const partes = [
    e.titulo,
    "",
    ...e.linhas,
    ...(e.temAberturas ? ["", "Ainda dá tempo:", ...e.aberturas.map((a) => `· ${a}`)] : []),
  ];
  return partes.join("\n");
}

export function renderResumoHtml(e: EmailResumo): string {
  const linhas = e.linhas.map((l) => `<p style="margin:.35rem 0">${escapar(l)}</p>`).join("");
  const aberturas = e.temAberturas
    ? `<p style="margin:1rem 0 .3rem;font-weight:600">Ainda dá tempo:</p><ul style="margin:0;padding-left:1.1rem">${e.aberturas
        .map((a) => `<li style="margin:.2rem 0">${escapar(a)}</li>`)
        .join("")}</ul>`
    : "";
  return `<!doctype html><html lang="pt-BR"><body style="font-family:system-ui,Arial,sans-serif;color:#1b1a17;max-width:520px;margin:0 auto;padding:1.5rem;line-height:1.5">
    <h1 style="font-size:1.25rem;margin:0 0 1rem">${escapar(e.titulo)}</h1>
    ${linhas}
    ${aberturas}
  </body></html>`;
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
