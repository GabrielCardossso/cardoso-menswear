import { formatarReais } from './dinheiro';

export const qtdPecas = (n: number) => `${n} ${n === 1 ? 'peça' : 'peças'}`;

/** "2 peças · R$ 169,80" */
export const resumoKit = (n: number, totalCentavos: number) => `${qtdPecas(n)} · ${formatarReais(totalCentavos)}`;
