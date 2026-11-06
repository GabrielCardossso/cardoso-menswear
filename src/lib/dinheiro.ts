const formato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Reais (como vêm do banco) para centavos inteiros. */
export function paraCentavos(valor: number): number {
  return Math.round(valor * 100);
}

/** Única forma de mostrar dinheiro na interface: "R$ 169,80" (com U+00A0 depois de "R$"). */
export function formatarReais(centavos: number): string {
  return formato.format(centavos / 100);
}
