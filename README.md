# Cardoso Menswear

Vitrine online da Cardoso Menswear (moda masculina, Capivari de Baixo, SC): o cliente vê as peças e
os kits com preço e tamanhos, monta a sacola e envia o pedido pronto para o WhatsApp da loja.
React + TypeScript + Vite + Tailwind.

> **Dados de exemplo.** Até a etapa 3 (Supabase), peças, preços, tamanhos e o número do WhatsApp vêm
> de `src/vitrine/vitrine-exemplo.json` e **não são os da loja**. As fotos são dos posts do Instagram.

## Como rodar

Precisa de Node 22 ou mais novo.

```sh
npm install        # instala as dependências
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm test           # testes unitários e de componentes (Vitest)
npm run test:e2e   # fluxo completo no navegador (Playwright)
```

O teste de ponta a ponta faz o build, sobe o `vite preview` na porta 4173 e percorre o fluxo numa
tela de 390 × 844, do início até o link do WhatsApp. Ele usa o Chromium do Playwright; se ainda não
estiver instalado, rode `npx playwright install chromium` uma vez (ou aponte `CHROMIUM_PATH` para
outro Chromium).

## Supabase

O banco é o projeto `cardoso-menswear` (São Paulo). As migrações ficam em `supabase/migrations/` e
chegam ao banco pela integração do Supabase com o GitHub, a partir da `main`.

Para o site ler o banco, copie `.env.example` para `.env.local` e preencha a URL e a chave
**publicável** (`sb_publishable_…`). Sem esse arquivo, o `npm run dev` e os testes usam o JSON de
exemplo; o build de produção sem as variáveis mostra erro em vez de peças de exemplo.

```sh
npm run test:integracao   # confere as regras de acesso no projeto real (lê o .env.local)
```

Esses testes só leem ou tentam gravar o que deve ser recusado: não deixam dado no banco.

## Endereços

- `/`: início, com kits e "Chegou agora".
- `/kits`, `/c/:slug` (categoria), `/novidades` (todas as peças).
- `/p/:slug` (peça) e `/k/:slug` (kit).
- `/finalizar`: nome e entrega, depois abre o WhatsApp com a mensagem pronta.

## Pastas

- `brand/`: logo em vetor e guia da marca.
- `docs/`: levantamento do Instagram, direções visuais, spec e planos (`docs/superpowers/`).
- `src/lib`, `src/sacola`, `src/pedido`, `src/vitrine`: regras, testadas sem tela.
- `src/components`, `src/pages`: telas.

## Branches

`main` é a branch de desenvolvimento; `producao` guarda o código em produção e só recebe merges
da `main` depois de verificado e aprovado.
