# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Simulador da Reforma Tributária 2026. Frontend estático (HTML/CSS/JS vanilla) servido pelo
backend Express, que também expõe a API de pagamentos Asaas.

## Estrutura

- **Raiz** — frontend estático: `index.html`, `css/style.css`, `js/app.js` (lógica do simulador
  e lead gate), `js/data.js` + `js/cclasstrib_oficial.json` (tabelas CST/CClassTrib, ~1,5k itens).
  Sem framework, sem bundler, sem ES modules — scripts entram via `<script src>` e usam escopo
  global; o estilo padrão é `var` + funções globais.
- **`server/`** — backend Node/Express (`server.js`, arquivo único). Serve o frontend da raiz via
  `express.static('..')` e a API em `/api/*`.

## Comandos

Os scripts npm ficam em `server/` — rode a partir de lá:

- `npm run dev` — sobe o Express com `node --watch` (recarrega ao salvar). Serve front + API.
- `npm start` — sobe sem watch.
- `npm run lint` — roda o ESLint na raiz (back + front). A config (`eslint.config.cjs`) e o ESLint
  ficam em `server/` de propósito — não há `package.json` na raiz para não mudar o build da Vercel.

Não há build nem testes. Para validar comportamento, use a skill `/smoke`. Um hook `PostToolUse`
roda `node --check` em todo `.js` salvo, pegando erro de sintaxe na hora.

## Backend / Asaas

- `ASAAS_API_KEY` é **obrigatória e não tem fallback** — sem ela o servidor sobe, mas toda chamada
  à Asaas falha. Copie `server/.env.example` para `server/.env`. Confira em `GET /api/health`
  (retorna `asaas: configured|missing_key` e `environment: sandbox|production`).
- Hoje aponta para **sandbox** (`ASAAS_API_URL`). Produção é dinheiro real — não troque sem
  autorização explícita.
- Sempre `.trim()` nas env vars usadas em `fetch` (header `access_token`) — podem vir com `\n`.
- O webhook `POST /api/webhook/asaas` apenas loga o evento; não persiste nada.

## Lead gate (frontend)

- O simulador fica bloqueado por um modal até o lead verificar o e-mail. A captura/verificação usa
  **Supabase Functions** (endpoint `API_LEAD` hardcoded em `js/app.js`), não a Asaas.
- O acesso é controlado só por `localStorage['leadId']` — client-side, bypassável; não é auth real.

## Deploy & Git

- Deploy na **Vercel**.
- Commits vão **direto na `main`** (sem branch de feature / PR). Mensagens em PT-BR no padrão
  `feat:` / `fix:`.
