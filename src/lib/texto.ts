/** Junta espaços e quebras de linha num espaço só, apara e corta em `max` caracteres sem partir emoji. */
export function limparTexto(texto: string, max: number): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return Array.from(limpo).slice(0, max).join('').trim();
}

/** "88745000" ou "88745-000" → "88745-000"; qualquer outra coisa → null. */
export function normalizarCep(texto: string): string | null {
  const t = texto.trim();
  if (!/^\d{5}-?\d{3}$/.test(t)) return null;
  const d = t.replace('-', '');
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
