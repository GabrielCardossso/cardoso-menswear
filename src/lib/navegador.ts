/** Sai do site para um link externo (o WhatsApp). Isolado aqui para os testes poderem substituir. */
export function abrirLink(url: string): void {
  window.location.assign(url);
}
