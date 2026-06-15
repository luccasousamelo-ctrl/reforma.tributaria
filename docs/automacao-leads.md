# Automação de notificação de leads — guia de implementação

Quando um visitante passa pelo lead gate (preenche nome + e-mail + WhatsApp e verifica o
e-mail), seria útil **notificar a equipe comercial** em tempo real para um follow-up rápido.
Este guia mostra onde e como plugar essa automação.

> Status: **não implementado** (decisão: documentar). O ponto de captura vive numa Supabase
> Edge Function que **não está neste repositório** — por isso a notificação é descrita aqui,
> para ser implementada na função (ou via webhook) por quem tem acesso a ela.

## Como funciona hoje

- O frontend (`js/app.js`) chama a Supabase Edge Function de captura:
  ```js
  var API_LEAD = 'https://wvfceibnzxrzdueoablw.supabase.co/functions/v1/simulador-lead';
  ```
  Há 4 chamadas (`fetch(API_LEAD, …)`): envio do código, verificação, etc.
- A função `simulador-lead` recebe os dados do lead, salva no Supabase e dispara o código de
  verificação por e-mail. **É nela que a notificação deve ser adicionada** — assim a regra de
  negócio fica server-side e independe do cliente.
- O backend Express deste repo (`server/server.js`) **não participa** desse fluxo (e a Vercel
  serve apenas o estático), então não é o lugar para a notificação.

## Payload disponível (lead)

| Campo | Origem | Exemplo |
|-------|--------|---------|
| `nome` | input `gateName` | "Maria Souza" |
| `email` | input `gateEmail` | "maria@empresa.com.br" |
| `telefone` / WhatsApp | input `gatePhone` | "(62) 99999-9999" |
| momento | timestamp do servidor | ISO 8601 |

Recomenda-se notificar **somente após o e-mail ser verificado** (lead qualificado), não no
primeiro envio do código.

## Opções de destino

### A) Webhook (n8n / Make / Zapier) — mais flexível
Crie um fluxo no n8n/Make/Zapier que recebe o lead e decide o canal (WhatsApp, e-mail, CRM).
Na Edge Function, após verificar o e-mail, dispare (fire-and-forget, sem travar a resposta):

```ts
// dentro da Edge Function simulador-lead, após confirmar a verificação
const LEAD_WEBHOOK_URL = Deno.env.get('LEAD_WEBHOOK_URL'); // configure no painel Supabase
if (LEAD_WEBHOOK_URL) {
  // não await: não atrasa a resposta ao usuário
  fetch(LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, telefone, origem: 'simulador-reforma', em: new Date().toISOString() }),
  }).catch((e) => console.error('falha ao notificar lead:', e));
}
```

### B) WhatsApp via Digisac — alinhado ao stack da MCO
A MCO já usa Digisac. Dispare uma mensagem para o número/atendente comercial usando a API do
Digisac (token + endpoint de envio). Mesmo padrão fire-and-forget; guarde o token em variável
de ambiente da função (`DIGISAC_TOKEN`), nunca no código.

### C) E-mail para a equipe
Reuse o mesmo provedor de e-mail que a função já usa para o código de verificação e envie uma
cópia para um endereço interno (ex.: `comercial@…`) com os dados do lead.

### D) Slack
`POST` num Incoming Webhook do Slack com um bloco resumindo o lead.

## Recomendações

- **Fire-and-forget**: nunca bloqueie a resposta ao usuário esperando a notificação.
- **Apenas leads verificados**: evita ruído de e-mails não confirmados.
- **Segredos em env vars** da Edge Function (painel Supabase) — `.trim()` ao usar em `fetch`.
- **Idempotência**: se a verificação puder ser reenviada, evite notificar o mesmo lead 2×
  (cheque um flag `notificado` no registro do lead).
- **LGPD**: o lead consentiu em ser contatado ao se cadastrar; mantenha a base e os disparos
  dentro da finalidade informada.

## Próximo passo

Escolha o canal (A–D), crie o destino (URL de webhook, token Digisac, etc.) e adicione o trecho
acima na Edge Function `simulador-lead`, atrás de uma variável de ambiente para ligar/desligar
sem novo deploy de código.
