---
name: smoke
description: Sobe o servidor Express local e faz um smoke test dos pontos-chave (health, frontend, rotas Asaas). Use para validar rapidamente que nada quebrou após uma mudança, já que o projeto não tem testes automatizados.
---

# Smoke test do simulador

Verificação rápida de que o app sobe e responde. Use após mudanças em `server/server.js`,
`js/app.js` ou no `index.html`.

## Passos

1. **Suba o servidor** (em background, a partir de `server/`):
   - `cd server && npm run dev` rodando em background, ou `node server.js`.
   - Use a porta de `PORT` (default `3001`). Aguarde o log `Servidor rodando em http://localhost:<porta>`.

2. **Health check** — `GET http://localhost:<porta>/api/health`. Deve responder 200 com
   `status: "ok"`. Reporte `asaas` (`configured`/`missing_key`) e `environment`
   (`sandbox`/`production`) — alerte se a chave estiver faltando ou se o ambiente for `production`.

3. **Frontend** — `GET http://localhost:<porta>/`. Deve devolver 200 e o HTML do `index.html`
   (procure por algo do simulador, ex. o `<title>` ou o lead gate).

4. **Rotas Asaas** (sem disparar cobrança real): confirme que respondem com erro de validação
   esperado, não 404 — ex. `POST /api/customers` com body vazio deve dar **400**
   ("Nome e CPF/CNPJ são obrigatórios"). Não crie clientes/assinaturas reais.

5. **Encerre o servidor** que você subiu.

## Saída

Reporte uma tabela curta: cada checagem com ✅/❌, o ambiente Asaas detectado, e qualquer
status inesperado. Se algo falhar, mostre o trecho relevante do log do servidor.
