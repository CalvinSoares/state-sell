import "server-only";

/**
 * Logger estruturado mínimo. Não é console.log (bloqueador de PR) — escreve
 * JSON em stdout/stderr, sem dado pessoal. Nunca logar e-mail, telefone ou nome.
 */
type Campos = Record<string, unknown>;

function emitir(nivel: "info" | "warn" | "error", evento: string, campos: Campos) {
  const linha = JSON.stringify({ nivel, evento, ...campos }) + "\n";
  if (nivel === "error") process.stderr.write(linha);
  else process.stdout.write(linha);
}

export const log = {
  info: (evento: string, campos: Campos = {}) => emitir("info", evento, campos),
  warn: (evento: string, campos: Campos = {}) => emitir("warn", evento, campos),
  error: (evento: string, campos: Campos = {}) => emitir("error", evento, campos),
};
