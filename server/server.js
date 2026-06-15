require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// .trim() obrigatório: env vars usadas em fetch podem vir com \n invisível (invariante do projeto).
const ASAAS_API_URL = (process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3').trim();
const ASAAS_API_KEY = (process.env.ASAAS_API_KEY || '').trim();
const ASAAS_WEBHOOK_TOKEN = (process.env.ASAAS_WEBHOOK_TOKEN || '').trim();
const ASAAS_TIMEOUT_MS = Number(process.env.ASAAS_TIMEOUT_MS) || 10000;

// CORS: allowlist por env (CSV em ALLOWED_ORIGINS). Vazio = libera (dev). Defina em produção.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Sem Origin (curl, mesma origem, server-to-server) ou allowlist vazia: permite.
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pelo CORS'));
  },
}));

// Headers de segurança básicos (sem dependência extra; CSP a cargo da plataforma).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '100kb' }));

// Corpo JSON malformado → 400 consistente (em vez de stack/HTML padrão do Express).
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  next(err);
});

// Rate-limit nas rotas /api/ (protege a criação de recursos no Asaas). Webhook fica livre.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/webhook/asaas',
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});
app.use('/api/', apiLimiter);

app.use(express.static(path.join(__dirname, '..')));

// ==================== HELPERS ====================

async function asaasRequest(endpoint, method = 'GET', body = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASAAS_TIMEOUT_MS);
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    signal: controller.signal,
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${ASAAS_API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.errors?.[0]?.description || 'Erro na API Asaas');
      error.status = res.status;
      error.details = data;
      throw error;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error('Tempo limite ao contatar a Asaas. Tente novamente.');
      error.status = 504;
      throw error;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ==================== VALIDAÇÃO ====================

function onlyDigits(v) {
  return String(v == null ? '' : v).replace(/\D/g, '');
}

function isValidCPF(cpf) {
  cpf = onlyDigits(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

function isValidCNPJ(cnpj) {
  cnpj = onlyDigits(cnpj);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const dv = (len) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(cnpj[len - i], 10) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === parseInt(cnpj[12], 10) && dv(13) === parseInt(cnpj[13], 10);
}

function isValidCpfCnpj(v) {
  const d = onlyDigits(v);
  if (d.length === 11) return isValidCPF(d);
  if (d.length === 14) return isValidCNPJ(d);
  return false;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==================== ROTAS: CLIENTES ====================

// Criar cliente no Asaas
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, cpfCnpj, mobilePhone } = req.body;

    if (!name || !cpfCnpj) {
      return res.status(400).json({ error: 'Nome e CPF/CNPJ são obrigatórios.' });
    }
    const doc = onlyDigits(cpfCnpj);
    if (!isValidCpfCnpj(doc)) {
      return res.status(400).json({ error: 'CPF/CNPJ inválido.' });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    // Verificar se cliente já existe pelo CPF/CNPJ
    const existing = await asaasRequest(`/customers?cpfCnpj=${doc}`);
    if (existing.data && existing.data.length > 0) {
      return res.json({ customer: existing.data[0], existing: true });
    }

    // Formatar telefone: Asaas espera DDxxxxxxxxx (10-11 digitos, sem +55)
    let phone = onlyDigits(mobilePhone);
    if (phone) {
      if (phone.startsWith('55') && phone.length > 11) phone = phone.slice(2);
      if (phone.length < 10 || phone.length > 11) phone = undefined;
    }

    const customerData = { name, email, cpfCnpj: doc, notificationDisabled: false };
    if (phone) customerData.mobilePhone = phone;

    const customer = await asaasRequest('/customers', 'POST', customerData);

    res.json({ customer, existing: false });
  } catch (err) {
    console.error('Erro ao criar cliente:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ==================== ROTAS: ASSINATURAS ====================

// Criar assinatura recorrente
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { customerId, billingType } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'ID do cliente é obrigatório.' });
    }

    // Verificar se já tem assinatura ativa
    const existingSubs = await asaasRequest(`/subscriptions?customer=${customerId}`);
    const activeSub = existingSubs.data?.find(s => s.status === 'ACTIVE');
    if (activeSub) {
      return res.json({ subscription: activeSub, existing: true });
    }

    // Próximo vencimento: amanhã no fuso BRT (Vercel roda em UTC; sem offset, à noite a data "pula").
    const nextDue = new Date(Date.now() - 3 * 60 * 60 * 1000);
    nextDue.setUTCDate(nextDue.getUTCDate() + 1);
    const dueDate = nextDue.toISOString().split('T')[0];

    const subscription = await asaasRequest('/subscriptions', 'POST', {
      customer: customerId,
      billingType: billingType || 'UNDEFINED', // UNDEFINED permite que o cliente escolha
      value: 49.90,
      nextDueDate: dueDate,
      cycle: 'MONTHLY',
      description: 'Simulador Reforma Tributária 2026 - Plano Profissional',
      externalReference: 'reforma-tributaria-pro',
    });

    res.json({ subscription, existing: false });
  } catch (err) {
    console.error('Erro ao criar assinatura:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Verificar status da assinatura
app.get('/api/subscriptions/status/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const subs = await asaasRequest(`/subscriptions?customer=${customerId}`);
    const activeSub = subs.data?.find(s => s.status === 'ACTIVE');

    if (activeSub) {
      // Buscar pagamentos da assinatura para ver se está em dia
      const payments = await asaasRequest(`/subscriptions/${activeSub.id}/payments`);
      const lastPayment = payments.data?.[0];

      return res.json({
        active: true,
        subscription: activeSub,
        lastPayment: lastPayment ? {
          status: lastPayment.status,
          dueDate: lastPayment.dueDate,
          paymentDate: lastPayment.paymentDate,
        } : null,
      });
    }

    res.json({ active: false });
  } catch (err) {
    console.error('Erro ao verificar assinatura:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Buscar link de pagamento da assinatura
app.get('/api/subscriptions/payment-link/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const subs = await asaasRequest(`/subscriptions?customer=${customerId}`);
    const sub = subs.data?.find(s => s.status === 'ACTIVE' || s.status === 'PENDING');

    if (!sub) {
      return res.status(404).json({ error: 'Nenhuma assinatura encontrada.' });
    }

    // Buscar pagamentos pendentes
    const payments = await asaasRequest(`/subscriptions/${sub.id}/payments?status=PENDING`);
    const pendingPayment = payments.data?.[0];

    if (pendingPayment) {
      return res.json({
        invoiceUrl: pendingPayment.invoiceUrl,
        bankSlipUrl: pendingPayment.bankSlipUrl,
        pixQrCode: pendingPayment.pixQrCodeUrl,
        dueDate: pendingPayment.dueDate,
        value: pendingPayment.value,
      });
    }

    res.json({ invoiceUrl: sub.invoiceUrl });
  } catch (err) {
    console.error('Erro ao buscar link:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Cancelar assinatura
app.delete('/api/subscriptions/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const subs = await asaasRequest(`/subscriptions?customer=${customerId}`);
    const activeSub = subs.data?.find(s => s.status === 'ACTIVE');

    if (!activeSub) {
      return res.status(404).json({ error: 'Nenhuma assinatura ativa encontrada.' });
    }

    await asaasRequest(`/subscriptions/${activeSub.id}`, 'DELETE');
    res.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ==================== WEBHOOK ASAAS ====================

app.post('/api/webhook/asaas', (req, res) => {
  // Autenticidade: o Asaas envia o token configurado no painel no header asaas-access-token.
  if (ASAAS_WEBHOOK_TOKEN && req.get('asaas-access-token') !== ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const event = req.body || {};
  console.log('Webhook Asaas recebido:', event.event, event.payment?.id || event.subscription?.id);

  // Eventos relevantes:
  // PAYMENT_CONFIRMED - pagamento confirmado
  // PAYMENT_RECEIVED - pagamento recebido
  // PAYMENT_OVERDUE - pagamento vencido
  // SUBSCRIPTION_DELETED - assinatura cancelada
  // SUBSCRIPTION_RENEWED - assinatura renovada

  // Aqui você pode integrar com banco de dados, enviar emails, etc.
  // Por enquanto, apenas logamos o evento

  res.status(200).json({ received: true });
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    asaas: ASAAS_API_KEY ? 'configured' : 'missing_key',
    environment: ASAAS_API_URL.includes('sandbox') ? 'sandbox' : 'production',
    webhook: ASAAS_WEBHOOK_TOKEN ? 'secured' : 'open',
  });
});

// ==================== SERVE FRONTEND ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Ambiente Asaas: ${ASAAS_API_URL.includes('sandbox') ? 'SANDBOX' : 'PRODUÇÃO'}`);
  if (!ASAAS_API_KEY) {
    console.warn('⚠️  ASAAS_API_KEY não configurada! Copie .env.example para .env e preencha.');
  }
});
