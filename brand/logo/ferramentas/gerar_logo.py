"""Gera a logo da Cardoso Menswear em SVG, com cada peça numa camada própria.

Uso: python brand/logo/ferramentas/gerar_logo.py brand/logo

Medidas tiradas da foto de perfil do Instagram (referencia/perfil-150.jpg,
150 x 150) e passadas para uma tela de 1000 x 1000 (fator 1000/150).
"CARDOSO" usa Anton e "MENSWEAR" usa Oswald Bold; os contornos das letras
vão direto para o SVG, então os arquivos finais não dependem das fontes.
"""
import math, os, random, sys
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
FONTES = os.path.join(HERE, "fontes")

BRANCO = "#FFFFFF"
PRETO = "#0A0A0A"     # tinta da versão preta (sobre fundo claro)
FUNDO = "#000000"     # fundo das versões quadradas, igual ao perfil do Instagram

# ---------- medidas (tela 1000 x 1000) ----------
LOSANGO_C = (501.0, 499.0)       # centro do losango
LOSANGO_R = 289.0                # meia diagonal
LOSANGO_TRACO = 4.5

CARDOSO_X, CARDOSO_W = 147.0, 706.0   # tinta de "CARDOSO": x inicial e largura
CARDOSO_BASE, CARDOSO_CAP = 593.0, 200.0
MENSWEAR_X, MENSWEAR_W = 290.0, 434.0
MENSWEAR_BASE, MENSWEAR_CAP = 672.0, 69.0   # 3 a menos de cada lado: o engrossamento devolve
MENSWEAR_ENGROSSA = 6.0
FOLGA_LOSANGO = 6.0              # quanto o losango some antes de encostar no texto

CABIDE_TRACO = 9.0               # linha branca do cabide
CABIDE_HALO = 8.0                # recorte em volta do cabide, de cada lado
CABIDE = {
    "gancho": "M490 508 L490 489 C490 478 509 473 509 456 C509 444 500 436 490 436 C480 436 472 443 471 452",
    "corpo": "M490 508 L362 591 L618 591 Z",
}


def n(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


class Caminho(BasePen):
    """Pen que escreve o contorno do glifo como path SVG, já posicionado."""

    def __init__(self, gs, x0, base, s):
        super().__init__(gs)
        self.x0, self.base, self.s, self.d = x0, base, s, []

    def p(self, pt):
        return f"{n(self.x0 + pt[0] * self.s)} {n(self.base - pt[1] * self.s)}"

    def _moveTo(self, a):
        self.d.append(f"M{self.p(a)}")

    def _lineTo(self, a):
        self.d.append(f"L{self.p(a)}")

    def _curveToOne(self, a, b, c):
        self.d.append(f"C{self.p(a)} {self.p(b)} {self.p(c)}")

    def _qCurveToOne(self, a, b):
        self.d.append(f"Q{self.p(a)} {self.p(b)}")

    def _closePath(self):
        self.d.append("Z")


def fonte(arquivo, eixos=None):
    f = TTFont(os.path.join(FONTES, arquivo))
    if eixos:
        f = instantiateVariableFont(f, eixos)
    return f.getGlyphSet(), f.getBestCmap()


def texto(gs, cmap, palavra, x_tinta, largura_tinta, base, cap):
    """Contornos de cada letra, com o espaçamento ajustado para a tinta ocupar
    exatamente [x_tinta, x_tinta + largura_tinta]."""
    bp = BoundsPen(gs)
    gs[cmap[ord("H")]].draw(bp)
    s = cap / bp.bounds[3]
    glifos = [gs[cmap[ord(c)]] for c in palavra]
    limites = []
    for g in glifos:
        b = BoundsPen(gs)
        g.draw(b)
        limites.append(b.bounds)
    avancos = [g.width * s for g in glifos]
    natural = sum(avancos[:-1]) + limites[-1][2] * s - limites[0][0] * s
    track = (largura_tinta - natural) / (len(palavra) - 1)
    x = x_tinta - limites[0][0] * s
    letras = {}
    for i, (c, g) in enumerate(zip(palavra, glifos)):
        pen = Caminho(gs, x, base, s)
        g.draw(pen)
        letras[f"letra-{i + 1}-{c}"] = "".join(pen.d)
        x += avancos[i] + track
    return letras


def losango():
    cx, cy, r = *LOSANGO_C, LOSANGO_R
    return f"M{n(cx)} {n(cy - r)} L{n(cx + r)} {n(cy)} L{n(cx)} {n(cy + r)} L{n(cx - r)} {n(cy)}Z"


def caixas_texto(folga):
    """Retângulos ocupados pelos dois textos, usados para esconder o losango."""
    f = folga
    return [
        (CARDOSO_X - f, CARDOSO_BASE - CARDOSO_CAP - f, CARDOSO_W + 2 * f, CARDOSO_CAP + 2 * f),
        (MENSWEAR_X - f, MENSWEAR_BASE - MENSWEAR_CAP - f, MENSWEAR_W + 2 * f, MENSWEAR_CAP + 2 * f),
    ]


def textura(semente=7):
    """Desgaste das letras: manchinhas irregulares, sempre iguais (semente fixa)."""
    rnd = random.Random(semente)
    pecas = []
    x0, y0 = CARDOSO_X, CARDOSO_BASE - CARDOSO_CAP
    x1, y1 = CARDOSO_X + CARDOSO_W, MENSWEAR_BASE
    for _ in range(950):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        r = rnd.choice((0.9, 1.2, 1.5, 1.9, 2.4, 3.2)) * rnd.uniform(0.7, 1.3)
        lados = rnd.randint(4, 7)
        pts = []
        for k in range(lados):
            ang = 6.2832 * k / lados + rnd.uniform(-0.3, 0.3)
            rr = r * rnd.uniform(0.55, 1.35)

            pts.append((x + rr * math.cos(ang), y + rr * math.sin(ang)))
        pecas.append("M" + " L".join(f"{n(a)} {n(b)}" for a, b in pts) + "Z")
    # riscos finos, como tinta gasta de serigrafia
    for _ in range(70):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        c, a = rnd.uniform(6, 22), rnd.uniform(-0.5, 0.5)
        e = rnd.uniform(0.6, 1.3)
        pecas.append(f"M{n(x)} {n(y)} l{n(c)} {n(a * c / 3)} l0 {n(e)} l{n(-c)} {n(-a * c / 3)}Z")
    return "".join(pecas)


def build():
    gs_a, cm_a = fonte("Anton-Regular.ttf")
    gs_o, cm_o = fonte("Oswald[wght].ttf", {"wght": 700})
    cardoso = texto(gs_a, cm_a, "CARDOSO", CARDOSO_X, CARDOSO_W, CARDOSO_BASE, CARDOSO_CAP)
    menswear = texto(gs_o, cm_o, "MENSWEAR", MENSWEAR_X, MENSWEAR_W, MENSWEAR_BASE, MENSWEAR_CAP)

    halo = CABIDE_TRACO + 2 * CABIDE_HALO
    cabide_traco = lambda w, cor: "".join(
        f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{n(w)}" stroke-linecap="round" stroke-linejoin="round"/>'
        for d in CABIDE.values())
    rects = lambda cor, f: "".join(
        f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{cor}"/>' for x, y, w, h in caixas_texto(f))

    def defs(com_textura):
        # m-losango: o losango some atrás dos textos
        # m-letras: o cabide recorta as letras (e a textura, se houver, gasta a tinta)
        t = f'<path d="{textura()}" fill="#000"/>' if com_textura else ""
        return (
            "<defs>"
            f'<mask id="m-losango" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">'
            f'<rect width="1000" height="1000" fill="#fff"/>{rects("#000", FOLGA_LOSANGO)}</mask>'
            f'<mask id="m-letras" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">'
            f'<rect width="1000" height="1000" fill="#fff"/>{cabide_traco(halo, "#000")}{t}</mask>'
            "</defs>"
        )

    def camadas(cor, fundo=None):
        cs = []
        if fundo:
            cs.append(("fundo", f'<rect width="1000" height="1000" fill="{fundo}"/>'))
        cs += [
            ("losango", f'<path d="{losango()}" fill="none" stroke="{cor}" stroke-width="{n(LOSANGO_TRACO)}" '
                        f'stroke-linejoin="miter" mask="url(#m-losango)"/>'),
            ("cardoso", f'<g mask="url(#m-letras)">' + "".join(
                f'<path id="{k}" d="{d}" fill="{cor}"/>' for k, d in cardoso.items()) + "</g>"),
            ("cabide", cabide_traco(CABIDE_TRACO, cor)),
            # o "MENSWEAR" original é mais pesado que a Oswald Bold: engrossa com um contorno da mesma cor
            ("menswear", f'<g mask="url(#m-letras)">' + "".join(
                f'<path id="{k}" d="{d}" fill="{cor}" stroke="{cor}" stroke-width="{n(MENSWEAR_ENGROSSA)}" '
                f'stroke-linejoin="round"/>' for k, d in menswear.items()) + "</g>"),
        ]
        return cs

    def svg(cs, titulo="Cardoso Menswear", vb="0 0 1000 1000", com_textura=False):
        corpo = "".join(f'<g id="{k}">{b}</g>' for k, b in cs)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="{titulo}">'
                f"<title>{titulo}</title>{defs(com_textura)}{corpo}</svg>\n")

    # recorte só do texto (sem o losango), para cabeçalho do site
    m = 16
    topo = CARDOSO_BASE - CARDOSO_CAP - m
    vb_texto = f"{n(CARDOSO_X - m)} {n(topo)} {n(CARDOSO_W + 2 * m)} {n(MENSWEAR_BASE + m - topo)}"
    sem_losango = lambda cs: [c for c in cs if c[0] != "losango"]

    arquivos = {
        # fundo transparente
        "cardoso-logo-branca.svg": svg(camadas(BRANCO)),
        "cardoso-logo-preta.svg": svg(camadas(PRETO)),
        # quadradas com fundo: Instagram, WhatsApp, ícone
        "cardoso-logo-avatar.svg": svg(camadas(BRANCO, FUNDO)),
        "cardoso-logo-avatar-textura.svg": svg(camadas(BRANCO, FUNDO), com_textura=True),
        # só o nome, para o topo do site
        "cardoso-nome-branco.svg": svg(sem_losango(camadas(BRANCO)), vb=vb_texto),
        "cardoso-nome-preto.svg": svg(sem_losango(camadas(PRETO)), vb=vb_texto),
    }
    for nome, conteudo in arquivos.items():
        open(os.path.join(OUT, nome), "w", encoding="utf-8").write(conteudo)

    pasta = os.path.join(OUT, "camadas")
    os.makedirs(pasta, exist_ok=True)
    for f in os.listdir(pasta):
        os.remove(os.path.join(pasta, f))
    for i, (k, b) in enumerate(camadas(BRANCO, FUNDO)):
        open(os.path.join(pasta, f"{i:02d}-{k}.svg"), "w", encoding="utf-8").write(
            svg([(k, b)], f"Cardoso Menswear: {k}"))
    print("ok", list(arquivos))


build()
