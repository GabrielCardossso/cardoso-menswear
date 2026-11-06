import { medidasReduzidas } from '../regras';

/**
 * Reduz a foto no navegador antes de enviar: lado maior com até 1600 px, em WebP (spec: "Fotos").
 * Rejeita com Error('foto-ilegivel') se o navegador não ler o arquivo (HEIC num Android, arquivo que
 * não é imagem) ou não gerar WebP.
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
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', 0.85));
    if (!blob || blob.type !== 'image/webp') throw new Error('foto-ilegivel');
    return blob;
  } finally {
    bitmap.close?.();
  }
}
