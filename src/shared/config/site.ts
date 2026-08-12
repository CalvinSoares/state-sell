/**
 * Identidade pública do site — usada em metadata, robots, sitemap e JSON-LD.
 * Domínio de produção: docs/base-de-conhecimentos/deploy.md
 */
export const SITE = {
  nome: "Prefeitura Quer",
  /** Fallback absoluto se APP_URL / NEXT_PUBLIC_APP_URL não estiver setado no build. */
  urlProducao: "https://prefeitura-quer.vercel.app",
  tituloPadrao:
    "Prefeitura Quer — avisa quando a prefeitura quer comprar o que você vende",
  descricao:
    "A gente lê os anúncios das prefeituras e manda e-mail quando aparecer compra do que você vende. Sem jargão. Sem promessa de contrato ganho.",
  locale: "pt_BR",
  idioma: "pt-BR",
  /** Contato para pedidos LGPD (acesso, correção, exclusão). */
  emailContato: "avisos@prefeituraquer.com.br",
  /** Data da última revisão da política de privacidade (DD/MM/AAAA). */
  privacidadeAtualizadaEm: "11/08/2026",
} as const;

/** URL canônica do app, sem barra no final. */
export function urlDoSite(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? SITE.urlProducao;
  return raw.replace(/\/$/, "");
}

export function urlAbsoluta(caminho = "/"): string {
  const base = urlDoSite();
  if (!caminho || caminho === "/") return base;
  return `${base}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
