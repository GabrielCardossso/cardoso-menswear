# Marca: Cardoso Menswear

Logo refeita em vetor a partir da foto de perfil do Instagram (@cardoso.menswear), que só existe em
150 × 150 px. O desenho é o mesmo: losango de linha fina, "CARDOSO" condensado e pesado, o cabide
vazando as letras "R" e "D", e "MENSWEAR" embaixo. Agora ela fica nítida em qualquer tamanho.

![Logo](logo/cardoso-logo-avatar.png)

## Arquivos (`logo/`)

| Arquivo | Uso |
| --- | --- |
| `cardoso-logo-branca.svg` / `.png` | Logo completa, branca, fundo transparente. Para fundos escuros e fotos. |
| `cardoso-logo-preta.svg` / `.png` | A mesma em preto, para fundos claros (etiqueta, sacola, nota). |
| `cardoso-logo-avatar.svg` / `.png` (1080) / `-512.png` | Quadrada com fundo preto: foto do Instagram, WhatsApp, ícone do site. |
| `cardoso-logo-avatar-textura.svg` / `.png` | Igual à anterior, com o desgaste de tinta da logo original. Para posts e stories. |
| `cardoso-nome-branco.svg` / `cardoso-nome-preto.svg` (+ `.png`) | Só "CARDOSO MENSWEAR" com o cabide, sem losango. Para o topo do site. |
| `camadas/` | Cada peça num SVG separado (fundo, losango, cardoso, cabide, menswear). |
| `referencia/perfil-150.jpg` | A foto de perfil original, usada para medir. |

Use sempre os SVG no site. A versão lisa é a principal; a com textura fica para peças de divulgação,
porque o desgaste some em tamanho pequeno.

## Cores

A marca é preto e branco, como os posts (roupa preta e branca fotografada em cima de carpete cinza).

| Nome | Hex | Onde |
| --- | --- | --- |
| Preto | `#000000` | Fundo das versões quadradas |
| Preto tinta | `#0A0A0A` | Logo e texto sobre fundo claro |
| Branco | `#FFFFFF` | Logo sobre fundo escuro |

## Tipografia

- **Anton**: "CARDOSO". Serve para títulos grandes do site.
- **Oswald** (700): "MENSWEAR". Serve para subtítulos, botões e etiquetas em caixa alta.

Ambas são gratuitas (Google Fonts, OFL).

## Como gerar de novo

Precisa de Python com `fonttools` e do Edge ou Chrome instalado (para os PNG).

```sh
pip install fonttools
python brand/logo/ferramentas/gerar_logo.py brand/logo
python brand/logo/ferramentas/renderizar.py brand/logo
```

As medidas ficam no começo de `gerar_logo.py`, na tela de 1000 × 1000 (fator 1000/150 sobre a
foto original).
