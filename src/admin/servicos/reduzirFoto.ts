import { medidasReduzidas } from '../regras';

const gerar = (canvas: HTMLCanvasElement, tipo: string) =>
  new Promise<Blob | null>((ok) => canvas.toBlob(ok, tipo, 0.85));

/**
 * Reduz a foto no navegador antes de enviar: lado maior com até 1600 px, em WebP (spec: "Fotos").
 * O Safari do iPhone não gera WebP (devolve PNG): nesse caso manda JPEG, que o bucket também aceita.
 * Rejeita com Error('foto-ilegivel') se o navegador não ler o arquivo (HEIC num Android, arquivo que
 * não é imagem) ou não gerar nem WebP nem JPEG.
 */
export async function reduzirFoto(arquivo: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(arquivo);
  } catch {
    throw new Error('foto-ilegivel');
  }
  try {
    const { largura, altura } = medidasReduzidas(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('foto-ilegivel');
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    const webp = await gerar(canvas, 'image/webp');
    if (webp?.type === 'image/webp') return webp;
    const jpeg = await gerar(canvas, 'image/jpeg');
    if (jpeg?.type === 'image/jpeg') return jpeg;
    throw new Error('foto-ilegivel');
  } finally {
    bitmap.close?.();
  }
}
