/**
 * Priorização da fila de rotulagem. Puro e determinístico (sem Math.random).
 * A "amostra aleatória" é obrigatória: rotular só caso difícil produz precisão
 * que não representa a realidade. Ver backoffice.md e ADR-007.
 */

export type OrigemAmostra = "dirigida" | "aleatoria" | "feedback" | "duvida";

export type Candidato = {
  hashTexto: string;
  itemId: string;
  descricaoItem: string;
  objetoCompra: string;
  unidadeMedida: string | null;
  municipioNome: string;
  /** score da classificação atual (0..1) ou null se sem ramo */
  score: number | null;
  ramoSugerido: string | null;
  temFeedbackNegativo: boolean;
};

export type ItemDaFila = Candidato & { origemAmostra: OrigemAmostra };

const LIMIAR_INF = 0.45;
const LIMIAR_SUP = 0.75;

/** Bucket determinístico a partir do hash: ~20% caem em "aleatoria". */
function ehAmostraAleatoria(hash: string): boolean {
  // usa os 2 primeiros hex chars → 0..255; < 51 ≈ 20%
  const n = parseInt(hash.slice(0, 2), 16);
  return n < 51;
}

type Bucket = "feedback" | "limiar" | "sem_ramo" | "aleatoria";

function classificar(c: Candidato): Bucket {
  if (c.temFeedbackNegativo) return "feedback";
  if (c.score != null && c.score >= LIMIAR_INF && c.score <= LIMIAR_SUP) return "limiar";
  if (ehAmostraAleatoria(c.hashTexto)) return "aleatoria";
  if (c.ramoSugerido == null) return "sem_ramo";
  return "limiar"; // fora da janela e classificado: ainda útil como caso dirigido
}

function origemDoBucket(b: Bucket): OrigemAmostra {
  if (b === "feedback") return "feedback";
  if (b === "aleatoria") return "aleatoria";
  return "dirigida";
}

/**
 * Monta a fila por round-robin ponderado entre os buckets:
 * limiar 40% · feedback 20% · sem_ramo 20% · aleatoria 20%.
 * Determinístico: preserva a ordem de entrada dentro de cada bucket.
 */
export function montarFila(candidatos: Candidato[], tamanho: number): ItemDaFila[] {
  const baldes: Record<Bucket, Candidato[]> = {
    limiar: [],
    feedback: [],
    sem_ramo: [],
    aleatoria: [],
  };
  for (const c of candidatos) baldes[classificar(c)].push(c);

  // Round-robin ponderado: limiar 40% · feedback 20% · sem_ramo 20% · aleatoria 20%.
  // Feedback lidera cada rodada (erro real, com custo já pago) sem mudar as proporções.
  const plano: Bucket[] = ["feedback", "limiar", "limiar", "sem_ramo", "aleatoria"];

  const fila: ItemDaFila[] = [];
  let restam = true;
  while (fila.length < tamanho && restam) {
    restam = false;
    for (const bucket of plano) {
      const prox = baldes[bucket].shift();
      if (prox) {
        fila.push({ ...prox, origemAmostra: origemDoBucket(bucket) });
        restam = true;
        if (fila.length >= tamanho) break;
      }
    }
  }
  return fila;
}
