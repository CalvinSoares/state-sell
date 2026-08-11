import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** junta classes ignorando vazios */
export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

/** Container centralizado com largura de leitura. */
export function Container({
  children,
  size = "md",
  className,
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const w = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-4xl" : "max-w-2xl";
  return <div className={cx("mx-auto w-full px-5", w, className)}>{children}</div>;
}

/** Cartão padrão (fundo, borda, raio). */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-[--radius-card] border border-borda bg-cartao p-5", className)}>
      {children}
    </div>
  );
}

const BOTAO_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento " +
  "disabled:cursor-default disabled:opacity-60";

const BOTAO_VARIANTE = {
  primario: "bg-acento text-white hover:bg-acento-forte",
  neutro: "border border-borda bg-cartao text-tinta hover:border-acento",
  fantasma: "text-acento hover:bg-acento-suave",
} as const;

const BOTAO_TAMANHO = {
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-6 py-3 text-base",
} as const;

type BotaoProps = {
  variante?: keyof typeof BOTAO_VARIANTE;
  tamanho?: keyof typeof BOTAO_TAMANHO;
};

export function Button({
  variante = "primario",
  tamanho = "md",
  className,
  ...props
}: BotaoProps & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cx(BOTAO_BASE, BOTAO_VARIANTE[variante], BOTAO_TAMANHO[tamanho], className)}
    />
  );
}

/** Botão que é um link (mesma aparência). */
export function LinkButton({
  variante = "primario",
  tamanho = "md",
  className,
  ...props
}: BotaoProps & ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cx(BOTAO_BASE, BOTAO_VARIANTE[variante], BOTAO_TAMANHO[tamanho], className)}
    />
  );
}

/** Selo/etiqueta (ex.: exclusivo ME/EPP, ramo). */
export function Badge({
  children,
  tom = "neutro",
}: {
  children: ReactNode;
  tom?: "neutro" | "acento";
}) {
  const cor =
    tom === "acento"
      ? "bg-acento-suave text-acento-forte"
      : "border border-borda bg-cartao text-suave";
  return (
    <span className={cx("inline-block rounded-full px-3 py-1 text-sm font-medium", cor)}>
      {children}
    </span>
  );
}

/** Campo de formulário com rótulo e erro. */
export function Field({
  label,
  ajuda,
  children,
}: {
  label?: string;
  ajuda?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block font-medium">{label}</span> : null}
      {ajuda ? <span className="mb-2 block text-sm text-suave">{ajuda}</span> : null}
      {children}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-lg border border-borda bg-[--campo-bg] px-3.5 py-2.5 text-tinta",
        "placeholder:text-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento",
        className,
      )}
    />
  );
}
