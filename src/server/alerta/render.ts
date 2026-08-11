/**
 * EmailAlerta/EmailResumo → HTML e texto. Puro. HTML seguro para e-mail:
 * tabelas + estilo inline (funciona em Gmail/Outlook), mobile-first, tema claro
 * (dark mode de e-mail é inconsistente entre clientes). Ver alertas-e-envio.md.
 */
import type { EmailAlerta } from "./compor";
import type { EmailResumo } from "./compor-resumo";
import { urlAbsoluta } from "@/src/shared/config/site";

const COR = {
  fundo: "#f4f2ec",
  cartao: "#ffffff",
  tinta: "#1b1a17",
  suave: "#6b6a63",
  acento: "#1f6f43",
  acentoEscuro: "#185737",
  acentoClaro: "#eef6f0",
  borda: "#e7e4dc",
  aviso: "#8a5a00",
  avisoBg: "#fff6e5",
};

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
    ...(e.descadastrarUrl ? [`Parar de receber: ${e.descadastrarUrl}`] : []),
  ];
  return partes.join("\n");
}

export function renderHtml(e: EmailAlerta): string {
  const linhas = e.linhas
    .map(
      (l, i) =>
        `<p style="margin:${i === 0 ? "0" : ".35rem"} 0 0;font-size:${i === 0 ? "17px" : "15px"};color:${COR.tinta}">${escapar(l)}</p>`,
    )
    .join("");

  const escala = e.avisoEscala
    ? `<p style="margin:14px 0 0;color:${COR.aviso};background:${COR.avisoBg};padding:10px 12px;border-radius:8px;font-size:14px">${escapar(e.avisoEscala)}</p>`
    : "";

  const prazoBox = `<table role="presentation" width="100%" style="margin:16px 0 0"><tr><td style="background:${COR.acentoClaro};color:${COR.acentoEscuro};padding:12px 14px;border-radius:8px;font-weight:700;font-size:15px">${escapar(e.prazo)}</td></tr></table>`;

  const botoes = `<table role="presentation" style="margin:20px 0 4px"><tr>
    <td style="border-radius:8px;background:${COR.acento}"><a href="${escapar(e.verEditalUrl)}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px">Ver o edital</a></td>
    <td style="width:12px"></td>
    <td><a href="${escapar(e.comoParticiparUrl)}" style="display:inline-block;padding:12px 8px;color:${COR.acento};text-decoration:none;font-weight:600;font-size:15px">Como enviar minha proposta →</a></td>
  </tr></table>`;

  const rodapeLinks = [
    e.naoEraPraMimUrl
      ? `<a href="${escapar(e.naoEraPraMimUrl)}" style="color:${COR.suave}">Não era pra mim</a>`
      : null,
    e.descadastrarUrl
      ? `<a href="${escapar(e.descadastrarUrl)}" style="color:${COR.suave}">Parar de receber</a>`
      : null,
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");

  const corpo = `
    <h1 style="margin:0;font-size:20px;line-height:1.3;color:${COR.tinta}">${escapar(e.titulo)}</h1>
    <div style="margin-top:14px">${linhas}</div>
    ${escala}
    ${prazoBox}
    ${botoes}`;

  const rodape = `
    <p style="margin:0;color:${COR.suave};font-size:13px;line-height:1.5">${escapar(e.porque)}</p>
    ${rodapeLinks ? `<p style="margin:8px 0 0;font-size:13px">${rodapeLinks}</p>` : ""}`;

  return casca(corpo, rodape);
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
  const linhas = e.linhas
    .map((l) => `<p style="margin:.4rem 0 0;font-size:15px;color:${COR.tinta}">${escapar(l)}</p>`)
    .join("");
  const aberturas = e.temAberturas
    ? `<p style="margin:16px 0 4px;font-weight:700;color:${COR.tinta}">Ainda dá tempo:</p>
       <ul style="margin:0;padding-left:18px;color:${COR.tinta};font-size:15px">${e.aberturas
         .map((a) => `<li style="margin:4px 0">${escapar(a)}</li>`)
         .join("")}</ul>`
    : "";
  const corpo = `<h1 style="margin:0;font-size:19px;color:${COR.tinta}">${escapar(e.titulo)}</h1>
    <div style="margin-top:12px">${linhas}</div>${aberturas}`;
  return casca(corpo);
}

/** Casca comum: fundo, cartão centralizado, cabeçalho de marca e rodapé. */
function casca(corpo: string, rodapeExtra = ""): string {
  return `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background:${COR.fundo};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" style="background:${COR.fundo}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" style="width:100%;max-width:600px;background:${COR.cartao};border:1px solid ${COR.borda};border-radius:14px;overflow:hidden">
    <tr><td style="padding:16px 24px;border-bottom:1px solid ${COR.borda}">
      <span style="color:${COR.acento};font-weight:800;font-size:15px;letter-spacing:.02em">Prefeitura Quer</span>
    </td></tr>
    <tr><td style="padding:24px">${corpo}</td></tr>
    ${
      rodapeExtra
        ? `<tr><td style="padding:16px 24px;border-top:1px solid ${COR.borda};background:#fbfaf7">${rodapeExtra}</td></tr>`
        : ""
    }
  </table>
  <p style="max-width:600px;margin:14px auto 0;color:${COR.suave};font-size:12px;line-height:1.5;padding:0 12px">
    Prefeitura Quer é um serviço independente, sem vínculo com prefeituras ou órgãos públicos.
    A gente só lê os anúncios oficiais, que são públicos.
    <a href="${escapar(urlAbsoluta("/privacidade"))}" style="color:${COR.suave}">Privacidade</a>
  </p>
</td></tr></table>
</body></html>`;
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
