require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ==================== HELPERS ====================

async function asaasRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${ASAAS_API_URL}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.errors?.[0]?.description || 'Erro na API Asaas');
    error.status = res.status;
    error.details = data;
    throw error;
  }
  return data;
}

// ==================== ROTAS: CLIENTES ====================

// Criar cliente no Asaas
app.post('/api/customers', async (req, res) => {
  try {
    const { name, email, cpfCnpj, mobilePhone } = req.body;

    if (!name || !cpfCnpj) {
      return res.status(400).json({ error: 'Nome e CPF/CNPJ são obrigatórios.' });
    }

    // Verificar se cliente já existe pelo CPF/CNPJ
    const existing = await asaasRequest(`/customers?cpfCnpj=${cpfCnpj.replace(/\D/g, '')}`);
    if (existing.data && existing.data.length > 0) {
      return res.json({ customer: existing.data[0], existing: true });
    }

    // Formatar telefone: Asaas espera DDxxxxxxxxx (10-11 digitos, sem +55)
    let phone = mobilePhone?.replace(/\D/g, '');
    if (phone) {
      if (phone.startsWith('55') && phone.length > 11) phone = phone.slice(2);
      if (phone.length < 10 || phone.length > 11) phone = undefined;
    }

    const customerData = { name, email, cpfCnpj: cpfCnpj.replace(/\D/g, ''), notificationDisabled: false };
    if (phone) customerData.mobilePhone = phone;

    const customer = await asaasRequest('/customers', 'POST', customerData);

    res.json({ customer, existing: false });
  } catch (err) {
    console.error('Erro ao criar cliente:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message, details: err.details });
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

    // Próximo vencimento: hoje + 1 dia
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);
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
    res.status(err.status || 500).json({ error: err.message, details: err.details });
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
    res.status(err.status || 500).json({ error: err.message, details: err.details });
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
    res.status(err.status || 500).json({ error: err.message, details: err.details });
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
    res.status(err.status || 500).json({ error: err.message, details: err.details });
  }
});

// ==================== WEBHOOK ASAAS ====================

app.post('/api/webhook/asaas', (req, res) => {
  const event = req.body;
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
