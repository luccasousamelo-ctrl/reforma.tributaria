// ==================== PAYWALL & ASSINATURA ====================

const API_BASE = window.location.port === ''
  ? '/api'
  : `http://localhost:3001/api`;

const PAYWALL = {
  FREE_SIMULATIONS_PER_DAY: 1,
  FREE_TABLE_ROWS: 5,
  PLAN_VALUE: 49.90,
};

// ==================== STATE ====================

function getSubscriptionState() {
  const raw = localStorage.getItem('subscription');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSubscriptionState(state) {
  localStorage.setItem('subscription', JSON.stringify({
    ...state,
    lastCheck: Date.now(),
  }));
}

function getCustomerState() {
  const raw = localStorage.getItem('customer');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCustomerState(customer) {
  localStorage.setItem('customer', JSON.stringify(customer));
}

function getSimulationCount() {
  const raw = localStorage.getItem('simCount');
  if (!raw) return { date: '', count: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { date: '', count: 0 };
  }
}

function incrementSimulation() {
  const today = new Date().toISOString().split('T')[0];
  const current = getSimulationCount();
  if (current.date !== today) {
    localStorage.setItem('simCount', JSON.stringify({ date: today, count: 1 }));
    return 1;
  }
  const newCount = current.count + 1;
  localStorage.setItem('simCount', JSON.stringify({ date: today, count: newCount }));
  return newCount;
}

function canSimulate() {
  if (isSubscribed()) return true;
  const today = new Date().toISOString().split('T')[0];
  const current = getSimulationCount();
  if (current.date !== today) return true;
  return current.count < PAYWALL.FREE_SIMULATIONS_PER_DAY;
}

function isSubscribed() {
  const sub = getSubscriptionState();
  return sub && sub.active === true;
}

// ==================== API CALLS ====================

async function createCustomer(data) {
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao criar cliente');
  }
  return res.json();
}

async function createSubscription(customerId, billingType) {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, billingType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao criar assinatura');
  }
  return res.json();
}

async function checkSubscriptionStatus(customerId) {
  const res = await fetch(`${API_BASE}/subscriptions/status/${customerId}`);
  if (!res.ok) return { active: false };
  return res.json();
}

async function getPaymentLink(customerId) {
  const res = await fetch(`${API_BASE}/subscriptions/payment-link/${customerId}`);
  if (!res.ok) return null;
  return res.json();
}

// ==================== SUBSCRIPTION FLOW ====================

async function handleSubscribe(billingType) {
  const customer = getCustomerState();
  if (!customer) {
    showSubscriptionModal();
    return;
  }

  const btn = document.getElementById('btn-subscribe');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processando...';
  }

  try {
    // Criar assinatura
    const result = await createSubscription(customer.id, billingType || 'UNDEFINED');

    if (result.subscription) {
      // Buscar link de pagamento
      const paymentData = await getPaymentLink(customer.id);

      if (paymentData?.invoiceUrl) {
        // Abrir link de pagamento em nova aba
        window.open(paymentData.invoiceUrl, '_blank');
        showPaymentPendingModal(paymentData.invoiceUrl);
      } else if (result.subscription.invoiceUrl) {
        window.open(result.subscription.invoiceUrl, '_blank');
        showPaymentPendingModal(result.subscription.invoiceUrl);
      }

      // Salvar estado
      setSubscriptionState({
        active: false,
        subscriptionId: result.subscription.id,
        pending: true,
      });
    }
  } catch (err) {
    alert('Erro: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Assinar Agora - R$ 49,90/mês';
    }
  }
}

async function verifySubscription() {
  const customer = getCustomerState();
  if (!customer) return false;

  try {
    const status = await checkSubscriptionStatus(customer.id);
    setSubscriptionState({
      active: status.active,
      subscriptionId: status.subscription?.id,
      lastPayment: status.lastPayment,
    });

    if (status.active) {
      applySubscribedState();
      return true;
    }
  } catch (err) {
    console.error('Erro ao verificar assinatura:', err);
  }
  return false;
}

// ==================== UI UPDATES ====================

function applySubscribedState() {
  document.body.classList.add('is-subscribed');

  // Atualizar navbar CTA
  const navCta = document.querySelector('.navbar-cta');
  if (navCta) {
    navCta.textContent = 'Assinante PRO';
    navCta.classList.add('navbar-cta-pro');
    navCta.href = '#simulador';
  }

  // Esconder pricing section
  const pricingSection = document.getElementById('pricing');
  if (pricingSection) pricingSection.style.display = 'none';

  // Remover blurs das tabelas
  document.querySelectorAll('.paywall-blur').forEach(el => {
    el.classList.remove('paywall-blur');
  });

  // Remover overlays de paywall
  document.querySelectorAll('.paywall-overlay').forEach(el => {
    el.remove();
  });

  // Atualizar contadores
  document.querySelectorAll('.sim-limit-badge').forEach(el => {
    el.innerHTML = '<span style="color:var(--success);">&#10004; Acesso ilimitado</span>';
  });
}

function applyFreeState() {
  document.body.classList.remove('is-subscribed');

  // Aplicar blur nas tabelas após N linhas
  setTimeout(() => {
    applyTablePaywall('cst-scroll', PAYWALL.FREE_TABLE_ROWS);
    applyTablePaywall('nbs-scroll', PAYWALL.FREE_TABLE_ROWS);
  }, 500);
}

function applyTablePaywall(containerId, freeRows) {
  if (isSubscribed()) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const tbody = container.querySelector('tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  rows.forEach((row, i) => {
    if (i >= freeRows) {
      row.classList.add('paywall-blur');
    }
  });

  // Adicionar overlay se não existir
  if (!container.querySelector('.paywall-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'paywall-overlay';
    overlay.innerHTML = `
      <div class="paywall-overlay-content">
        <div class="paywall-lock-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h4>Acesso Completo</h4>
        <p>Assine o plano Profissional para acessar todos os ${containerId.includes('cst') ? 'produtos e NCMs' : 'serviços NBS'}</p>
        <a href="#pricing" class="btn-paywall-upgrade">Desbloquear por R$ 49,90/mês</a>
      </div>
    `;
    container.style.position = 'relative';
    container.appendChild(overlay);
  }
}

function showSimulationLimit() {
  const modal = document.createElement('div');
  modal.className = 'paywall-modal-overlay';
  modal.id = 'simLimitModal';
  modal.innerHTML = `
    <div class="paywall-modal">
      <button class="paywall-modal-close" onclick="this.closest('.paywall-modal-overlay').remove()">&times;</button>
      <div class="paywall-modal-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <h3>Limite de Simulações</h3>
      <p>Você atingiu o limite de <strong>${PAYWALL.FREE_SIMULATIONS_PER_DAY} simulação gratuita por dia</strong>.</p>
      <p>Assine o plano Profissional para simulações ilimitadas, acesso completo às tabelas CST/NBS e relatórios detalhados.</p>
      <div class="paywall-modal-price">
        <span class="price-value">R$ 49,90</span>
        <span class="price-period">/mês</span>
      </div>
      <a href="#pricing" class="btn-primary" onclick="this.closest('.paywall-modal-overlay').remove()" style="margin-top:16px;">
        Ver Plano Profissional
      </a>
      <p class="paywall-modal-note">Cancele quando quiser. Sem fidelidade.</p>
    </div>
  `;
  document.body.appendChild(modal);
}

function showSubscriptionModal() {
  const modal = document.createElement('div');
  modal.className = 'paywall-modal-overlay';
  modal.id = 'subModal';
  modal.innerHTML = `
    <div class="paywall-modal" style="max-width:480px;">
      <button class="paywall-modal-close" onclick="this.closest('.paywall-modal-overlay').remove()">&times;</button>
      <h3>Complete seus dados</h3>
      <p>Para assinar, precisamos do seu CPF ou CNPJ para gerar a cobrança.</p>
      <form id="subscriptionForm" onsubmit="return handleSubscriptionForm(event)">
        <div class="form-group">
          <label>Nome completo</label>
          <input type="text" id="sub-name" required placeholder="Seu nome">
        </div>
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" id="sub-email" required placeholder="seu@email.com">
        </div>
        <div class="form-group">
          <label>CPF ou CNPJ</label>
          <input type="text" id="sub-cpfcnpj" required placeholder="000.000.000-00">
        </div>
        <div class="form-group">
          <label>WhatsApp</label>
          <input type="tel" id="sub-phone" placeholder="(11) 99999-9999">
        </div>
        <button type="submit" class="btn-primary" id="btn-subscribe-form">
          Continuar para Pagamento
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Pré-preencher com dados do lead se existirem
  const leads = JSON.parse(localStorage.getItem('leads') || '[]');
  const lastLead = leads[leads.length - 1];
  if (lastLead) {
    const nameInput = document.getElementById('sub-name');
    const emailInput = document.getElementById('sub-email');
    const phoneInput = document.getElementById('sub-phone');
    const cpfInput = document.getElementById('sub-cpfcnpj');
    if (nameInput && lastLead.name) nameInput.value = lastLead.name;
    if (emailInput && lastLead.email) emailInput.value = lastLead.email;
    if (phoneInput && lastLead.phone) phoneInput.value = lastLead.phone;
    if (cpfInput && lastLead.cnpj) cpfInput.value = lastLead.cnpj;
  }
}

async function handleSubscriptionForm(e) {
  e.preventDefault();

  const btn = document.getElementById('btn-subscribe-form');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Criando conta...';

  try {
    const data = {
      name: document.getElementById('sub-name').value,
      email: document.getElementById('sub-email').value,
      cpfCnpj: document.getElementById('sub-cpfcnpj').value,
      mobilePhone: document.getElementById('sub-phone').value,
    };

    // Criar cliente no Asaas
    const result = await createCustomer(data);
    setCustomerState(result.customer);

    // Fechar modal de dados
    const modal = document.getElementById('subModal');
    if (modal) modal.remove();

    // Criar assinatura
    await handleSubscribe('UNDEFINED');
  } catch (err) {
    alert('Erro: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = 'Continuar para Pagamento';
  }

  return false;
}

function showPaymentPendingModal(invoiceUrl) {
  // Remover modais existentes
  document.querySelectorAll('.paywall-modal-overlay').forEach(el => el.remove());

  const modal = document.createElement('div');
  modal.className = 'paywall-modal-overlay';
  modal.id = 'paymentPendingModal';
  modal.innerHTML = `
    <div class="paywall-modal">
      <button class="paywall-modal-close" onclick="this.closest('.paywall-modal-overlay').remove()">&times;</button>
      <div class="paywall-modal-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h3>Assinatura Criada!</h3>
      <p>Seu link de pagamento foi gerado. Complete o pagamento para liberar o acesso completo.</p>
      <a href="${invoiceUrl}" target="_blank" class="btn-primary" style="margin:16px 0;">
        Abrir Link de Pagamento
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
      </a>
      <button class="btn-verify-payment" onclick="verifyAndRefresh()">
        Ja fiz o pagamento - Verificar
      </button>
      <p class="paywall-modal-note">Apos o pagamento, clique em "Verificar" para liberar o acesso.</p>
    </div>
  `;
  document.body.appendChild(modal);
}

async function verifyAndRefresh() {
  const btn = document.querySelector('.btn-verify-payment');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verificando...';
  }

  const confirmed = await verifySubscription();

  if (confirmed) {
    document.querySelectorAll('.paywall-modal-overlay').forEach(el => el.remove());
    applySubscribedState();
    // Re-render tabelas sem blur
    if (typeof renderCST === 'function') renderCST(cstData);
    if (typeof renderNBS === 'function') renderNBS(nbsData);
  } else {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Ja fiz o pagamento - Verificar';
    }
    alert('Pagamento ainda nao confirmado. Aguarde alguns instantes e tente novamente.');
  }
}

// ==================== SIMULATION GUARD ====================

function guardSimulation(callback) {
  if (!canSimulate()) {
    showSimulationLimit();
    return false;
  }
  incrementSimulation();
  callback();

  // Atualizar badge de contagem
  if (!isSubscribed()) {
    const today = new Date().toISOString().split('T')[0];
    const count = getSimulationCount();
    const remaining = Math.max(0, PAYWALL.FREE_SIMULATIONS_PER_DAY - (count.date === today ? count.count : 0));
    document.querySelectorAll('.sim-limit-badge').forEach(el => {
      el.textContent = `${remaining} simulacao(oes) restante(s) hoje`;
    });
  }
  return true;
}

// ==================== INIT ====================

function initPaywall() {
  const sub = getSubscriptionState();

  if (sub?.active) {
    // Verificar periodicamente (a cada 1h)
    const hourAgo = Date.now() - (60 * 60 * 1000);
    if (!sub.lastCheck || sub.lastCheck < hourAgo) {
      verifySubscription();
    } else {
      applySubscribedState();
    }
  } else if (sub?.pending) {
    // Tem assinatura pendente, verificar
    verifySubscription();
    applyFreeState();
  } else {
    applyFreeState();
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initPaywall);
