import { reduzirFoto } from './reduzirFoto';

const arquivo = new Blob(['x'], { type: 'image/jpeg' });

afterEach(() => vi.unstubAllGlobals());

describe('reduzirFoto', () => {
  it('foto que o navegador não lê vira foto-ilegivel', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('formato')));
    await expect(reduzirFoto(arquivo)).rejects.toThrow('foto-ilegivel');
  });

  it('reduz para no máximo 1600 px e gera WebP', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }));
    const ctx = { drawImage: vi.fn() };
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (this: HTMLCanvasElement, cb: BlobCallback, tipo?: string) {
        cb(new Blob([`${this.width}x${this.height}`], { type: tipo }));
      });
    const blob = await reduzirFoto(arquivo);
    expect(blob.type).toBe('image/webp');
    expect(await blob.text()).toBe('1600x1200');
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.85);
    getContext.mockRestore();
    toBlob.mockRestore();
  });

  it('navegador que não gera WebP (iPhone) manda JPEG', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() }));
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((cb: BlobCallback, tipo?: string) =>
        cb(new Blob(['x'], { type: tipo === 'image/jpeg' ? 'image/jpeg' : 'image/png' })),
      );
    const blob = await reduzirFoto(arquivo);
    expect(blob.type).toBe('image/jpeg');
    expect(toBlob).toHaveBeenLastCalledWith(expect.any(Function), 'image/jpeg', 0.85);
    getContext.mockRestore();
    toBlob.mockRestore();
  });

  it('sem WebP nem JPEG é foto-ilegivel', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() }));
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((cb: BlobCallback) => cb(new Blob(['x'], { type: 'image/png' })));
    await expect(reduzirFoto(arquivo)).rejects.toThrow('foto-ilegivel');
    getContext.mockRestore();
    toBlob.mockRestore();
  });
});
