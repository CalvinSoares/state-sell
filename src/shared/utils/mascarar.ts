/** Mascara e-mail para exibição no backoffice. Puro. Ver backoffice.md (privacidade). */
export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (!usuario || !dominio) return "***";
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"*".repeat(Math.max(1, usuario.length - 2))}@${dominio}`;
}
