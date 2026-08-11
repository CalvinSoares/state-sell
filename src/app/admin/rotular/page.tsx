import { RAMOS } from "@/content/ramos";
import { Rotulador } from "./_components/Rotulador";

/** Composição — sem lógica. A tela vive no client component Rotulador. */
export default function RotularPage() {
  const ramos = RAMOS.map((r) => ({ slug: r.slug, rotulo: r.rotulo }));
  return <Rotulador ramos={ramos} />;
}
