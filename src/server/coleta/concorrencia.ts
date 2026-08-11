/**
 * Executa tarefas com concorrência limitada. Nunca Promise.all sobre a lista
 * inteira — estoura conexões e file descriptors. Ver coleta-e-jobs.md.
 */
export async function comConcorrencia<T, R>(
  itens: readonly T[],
  limite: number,
  tarefa: (item: T, indice: number) => Promise<R>,
): Promise<R[]> {
  const resultados: R[] = new Array(itens.length);
  let proximo = 0;

  async function trabalhador(): Promise<void> {
    while (proximo < itens.length) {
      const indice = proximo++;
      resultados[indice] = await tarefa(itens[indice]!, indice);
    }
  }

  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, () =>
    trabalhador(),
  );
  await Promise.all(trabalhadores);
  return resultados;
}
