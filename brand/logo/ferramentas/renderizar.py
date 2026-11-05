"""Gera os PNG a partir dos SVG usando o Edge (ou Chrome) em modo headless.

Uso: python brand/logo/ferramentas/renderizar.py brand/logo

Cada SVG vira um PNG do tamanho pedido em TAMANHOS; os de fundo transparente
continuam transparentes.
"""
import os, shutil, subprocess, sys, tempfile

OUT = os.path.abspath(sys.argv[1])
TAMANHOS = {
    "cardoso-logo-branca": [(2000, 2000)],
    "cardoso-logo-preta": [(2000, 2000)],
    "cardoso-logo-avatar": [(1080, 1080), (512, 512)],
    "cardoso-logo-avatar-textura": [(1080, 1080)],
    "cardoso-nome-branco": [(1600, None)],
    "cardoso-nome-preto": [(1600, None)],
}
NAVEGADORES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]


def viewbox(svg):
    i = svg.index('viewBox="') + 9
    return [float(v) for v in svg[i:svg.index('"', i)].split()]


def main():
    nav = next(p for p in NAVEGADORES if os.path.exists(p))
    tmp = tempfile.mkdtemp()
    try:
        for nome, tamanhos in TAMANHOS.items():
            svg = open(os.path.join(OUT, nome + ".svg"), encoding="utf-8").read()
            _, _, vw, vh = viewbox(svg)
            for w, h in tamanhos:
                h = h or round(w * vh / vw)
                html = os.path.join(tmp, "p.html")
                open(html, "w", encoding="utf-8").write(
                    "<!doctype html><style>html,body{margin:0;background:transparent}"
                    f"svg{{display:block;width:{w}px;height:{h}px}}</style>{svg}")
                sufixo = "" if (w, h) == (tamanhos[0][0], tamanhos[0][1] or h) else f"-{w}"
                png = os.path.join(OUT, f"{nome}{sufixo}.png")
                subprocess.run([nav, "--headless", "--disable-gpu", "--hide-scrollbars",
                                "--default-background-color=00000000", f"--user-data-dir={tmp}\\perfil",
                                f"--window-size={w},{h}", f"--screenshot={png}", "file:///" + html.replace("\\", "/")],
                               check=True, capture_output=True, timeout=60)
                print("ok", os.path.basename(png), f"{w}x{h}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


main()
