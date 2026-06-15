function parseCurrency(value) {
  if (!value) return 0;
  return parseFloat(String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
}

function formatCurrency(input) {
  let v = input.value.replace(/\D/g, '');
  if (!v) { input.value = ''; return; }
  v = (parseInt(v) / 100).toFixed(2);
  v = v.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = v;
}

function formatBRL(n) {
  n = Number(n);
  if (!isFinite(n)) n = 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPct(n) {
  n = Number(n);
  if (!isFinite(n)) n = 0;
  return n.toFixed(2).replace('.', ',') + '%';
}

// Limita percentuais informados pelo usuário ao intervalo [0, 100]
function clampPct(value) {
  var v = parseFloat(value);
  if (!isFinite(v)) v = 0;
  return Math.min(100, Math.max(0, v));
}

// Escapa texto para inserção segura em HTML (conteúdo e atributos)
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// CTA de WhatsApp exibido ao fim do resultado — captura o pico de intenção do usuário.
function waResultCTA() {
  var msg = encodeURIComponent('Olá! Fiz a simulação da Reforma Tributária no site e quero falar com um especialista sobre o meu resultado.');
  return '<a href="https://wa.me/5562999939810?text=' + msg + '" target="_blank" rel="noopener" class="result-wa-cta">' +
    '<svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.004 0C7.165 0 .002 7.163.002 16c0 2.825.737 5.585 2.14 8.018L.009 32l8.188-2.083A15.93 15.93 0 0016.004 32C24.837 32 32 24.837 32 16S24.837 0 16.004 0zm0 29.09a13.05 13.05 0 01-6.883-1.95l-.493-.295-5.117 1.302 1.37-4.994-.324-.514A13.01 13.01 0 012.912 16c0-7.216 5.876-13.09 13.092-13.09S29.09 8.784 29.09 16c0 7.216-5.87 13.09-13.086 13.09z"/></svg>' +
    '<span>Falar com um especialista sobre esse resultado</span></a>';
}

// ==================== UI FEEDBACK ====================
function showToast(message, type) {
  type = type || 'error';
  var existing = document.querySelectorAll('.toast');
  existing.forEach(function(t) { t.remove(); });

  var icons = { error: '\u26a0\ufe0f', success: '\u2705', info: '\u2139\ufe0f' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span><span>' + message + '</span>';
  document.body.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('toast-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 4000);
}

function showFormError(containerId, message) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var existing = container.querySelector('.sim-form-alert');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.className = 'sim-form-alert alert-error';
  el.innerHTML = '<span>\u26a0\ufe0f</span><span>' + message + '</span>';
  container.insertBefore(el, container.querySelector('.sim-form') || container.firstChild);

  setTimeout(function() { el.remove(); }, 6000);
}

function setFieldError(groupId, message) {
  var group = document.getElementById(groupId);
  if (!group) return;
  clearFieldError(groupId);
  group.classList.add('has-error');
  var err = document.createElement('div');
  err.className = 'field-error';
  err.textContent = message;
  group.appendChild(err);
}

function clearFieldError(groupId) {
  var group = document.getElementById(groupId);
  if (!group) return;
  group.classList.remove('has-error');
  var err = group.querySelector('.field-error');
  if (err) err.remove();
}

function clearAllFieldErrors(form) {
  if (!form) return;
  form.querySelectorAll('.has-error').forEach(function(g) { g.classList.remove('has-error'); });
  form.querySelectorAll('.field-error').forEach(function(e) { e.remove(); });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  var digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

// ==================== DEBOUNCE ====================
function debounce(fn, delay) {
  let timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

// ==================== API CONFIG ====================
var API_LEAD = 'https://wvfceibnzxrzdueoablw.supabase.co/functions/v1/simulador-lead';

// ==================== LEAD GATE ====================
function isLeadVerified() {
  try {
    var lead = JSON.parse(localStorage.getItem('simulador_lead') || 'null');
    return lead && lead.verified === true;
  } catch(e) { return false; }
}

function saveLeadLocal(data) {
  localStorage.setItem('simulador_lead', JSON.stringify(data));
}

function showLeadGateModal(callback) {
  var existing = document.getElementById('leadGateModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.className = 'lead-overlay';
  modal.id = 'leadGateModal';
  modal.innerHTML = '<div class="lead-card">' +
    '<button class="lead-close" onclick="this.closest(\'.lead-overlay\').remove()" aria-label="Fechar">&times;</button>' +
    '<div class="lead-badge">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' +
      'Acesso Gratuito' +
    '</div>' +
    '<h2>Crie sua conta e <span>continue simulando</span></h2>' +
    '<p class="lead-sub">Sua primeira simulação está liberada. Cadastre-se grátis (leva menos de 1 minuto, confirmação por e-mail) para acessar as demais abas, comparações e relatórios completos.</p>' +
    '<div id="leadGateStep1">' +
      '<form id="leadGateForm" novalidate>' +
        '<div class="form-group" id="fg-gateName">' +
          '<label for="gateName">Nome completo</label>' +
          '<input type="text" id="gateName" placeholder="Seu nome" autocomplete="name">' +
        '</div>' +
        '<div class="form-group" id="fg-gateEmail">' +
          '<label for="gateEmail">E-mail</label>' +
          '<input type="email" id="gateEmail" placeholder="seu@empresa.com.br" autocomplete="email">' +
        '</div>' +
        '<div class="form-group" id="fg-gatePhone">' +
          '<label for="gatePhone">WhatsApp</label>' +
          '<input type="tel" id="gatePhone" placeholder="(62) 99999-9999" autocomplete="tel">' +
        '</div>' +
        '<div id="leadGateError" style="display:none;background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;"></div>' +
        '<button type="submit" class="btn-primary" id="leadGateBtn">' +
          'Enviar Código de Verificação' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
        '</button>' +
      '</form>' +
    '</div>' +
    '<div id="leadGateStep2" style="display:none;">' +
      '<div style="text-align:center;margin-bottom:20px;">' +
        '<div style="width:56px;height:56px;background:#e8effc;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a56db" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
        '</div>' +
        '<p style="font-size:15px;color:var(--gray-700);">Enviamos um código de 6 dígitos para</p>' +
        '<p style="font-size:15px;font-weight:700;color:var(--dark);" id="leadGateEmailSent"></p>' +
      '</div>' +
      '<form id="leadVerifyForm" novalidate>' +
        '<div class="form-group" id="fg-verifyCode">' +
          '<label for="verifyCode">Código de verificação</label>' +
          '<input type="text" id="verifyCode" placeholder="000000" maxlength="6" autocomplete="one-time-code" style="text-align:center;font-size:24px;font-weight:800;letter-spacing:8px;font-family:monospace;">' +
        '</div>' +
        '<div id="verifyError" style="display:none;background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;"></div>' +
        '<button type="submit" class="btn-primary" id="verifyBtn">' +
          'Verificar e Liberar Acesso' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
        '</button>' +
      '</form>' +
      '<div style="text-align:center;margin-top:14px;">' +
        '<button type="button" id="resendBtn" style="background:none;border:none;color:var(--primary);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Reenviar código</button>' +
        '<p style="font-size:12px;color:var(--gray-500);margin-top:6px;">O código expira em 10 minutos</p>' +
      '</div>' +
    '</div>' +
    '<div id="leadGateStep3" style="display:none;text-align:center;">' +
      '<div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2.5" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '</div>' +
      '<h2 style="font-size:22px;color:var(--dark);margin-bottom:8px;">E-mail verificado!</h2>' +
      '<p style="color:var(--gray-600);font-size:15px;">Seu acesso ao simulador foi liberado com sucesso.</p>' +
    '</div>' +
    '<div class="lead-trust">' +
      '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Dados protegidos</span>' +
      '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 100% gratuito</span>' +
      '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M10 9h4M10 13h4M10 17h4"/></svg> Ferramenta da MCO Contábil</span>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modal);

  // Recuperar lead_id do localStorage caso exista (ex: popup overlay já salvou)
  function getLeadId() {
    try {
      var lead = JSON.parse(localStorage.getItem('simulador_lead') || 'null');
      return lead ? lead.lead_id : null;
    } catch(e) { return null; }
  }

  // Step 1: Enviar dados e receber código
  document.getElementById('leadGateForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('leadGateBtn');
    var errDiv = document.getElementById('leadGateError');
    errDiv.style.display = 'none';
    clearFieldError('fg-gateName');
    clearFieldError('fg-gateEmail');
    clearFieldError('fg-gatePhone');

    // Validação customizada
    var nome = document.getElementById('gateName').value.trim();
    var email = document.getElementById('gateEmail').value.trim();
    var phone = document.getElementById('gatePhone').value.trim();
    var hasError = false;

    if (!nome || nome.length < 2) {
      setFieldError('fg-gateName', 'Preencha seu nome para continuar.');
      hasError = true;
    }
    if (!email || !validateEmail(email)) {
      setFieldError('fg-gateEmail', 'Informe um e-mail válido.');
      hasError = true;
    }
    if (!phone || !validatePhone(phone)) {
      setFieldError('fg-gatePhone', 'Digite um WhatsApp válido com DDD.');
      hasError = true;
    }
    if (hasError) return;

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      var res = await fetch(API_LEAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          nome: document.getElementById('gateName').value,
          email: document.getElementById('gateEmail').value,
          telefone: document.getElementById('gatePhone').value
        })
      });
      var result = await res.json();

      if (!res.ok) {
        errDiv.textContent = result.error || 'Erro ao enviar. Tente novamente.';
        errDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Enviar Código de Verificação';
        return;
      }

      saveLeadLocal({ lead_id: result.lead_id, email: document.getElementById('gateEmail').value, verified: false });

      // Mostrar step 2
      document.getElementById('leadGateStep1').style.display = 'none';
      document.getElementById('leadGateStep2').style.display = 'block';
      document.getElementById('leadGateEmailSent').textContent = document.getElementById('gateEmail').value;
      document.getElementById('verifyCode').focus();

    } catch(err) {
      errDiv.textContent = 'Erro de conexão. Verifique sua internet.';
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Enviar Código de Verificação';
    }
  });

  // Step 2: Verificar código
  document.getElementById('leadVerifyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = document.getElementById('verifyBtn');
    var errDiv = document.getElementById('verifyError');
    var leadId = getLeadId();
    errDiv.style.display = 'none';
    clearFieldError('fg-verifyCode');

    if (!leadId) {
      errDiv.textContent = 'Cadastro não encontrado. Preencha o formulário novamente.';
      errDiv.style.display = 'block';
      return;
    }

    var codigo = document.getElementById('verifyCode').value.trim();
    if (!codigo || codigo.length !== 6 || !/^\d{6}$/.test(codigo)) {
      setFieldError('fg-verifyCode', 'Digite o código de 6 dígitos enviado para seu e-mail.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
      var res = await fetch(API_LEAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          lead_id: leadId,
          codigo: document.getElementById('verifyCode').value
        })
      });
      var result = await res.json();

      if (!res.ok) {
        errDiv.textContent = result.error || 'Código inválido.';
        errDiv.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Verificar e Liberar Acesso';
        document.getElementById('verifyCode').value = '';
        document.getElementById('verifyCode').focus();
        return;
      }

      // Sucesso!
      saveLeadLocal({ lead_id: leadId, verified: true });
      document.getElementById('leadGateStep2').style.display = 'none';
      document.getElementById('leadGateStep3').style.display = 'block';

      setTimeout(function() {
        modal.remove();
        unlockSimulator();
        if (callback) callback();
      }, 1500);

    } catch(err) {
      errDiv.textContent = 'Erro de conexão. Tente novamente.';
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Verificar e Liberar Acesso';
    }
  });

  // Reenviar código
  document.getElementById('resendBtn').addEventListener('click', async function() {
    var btn = this;
    var leadId = getLeadId();
    if (!leadId) return;

    btn.disabled = true;
    btn.textContent = 'Reenviando...';

    try {
      var res = await fetch(API_LEAD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', lead_id: leadId })
      });
      var result = await res.json();

      if (!res.ok) {
        var errDiv = document.getElementById('verifyError');
        errDiv.textContent = result.error || 'Erro ao reenviar.';
        errDiv.style.display = 'block';
      } else {
        btn.textContent = 'Código reenviado!';
        document.getElementById('verifyCode').value = '';
        document.getElementById('verifyCode').focus();
      }
    } catch(err) {
      btn.textContent = 'Erro ao reenviar';
    }

    setTimeout(function() {
      btn.disabled = false;
      btn.textContent = 'Reenviar código';
    }, 3000);
  });

  // Se já tem lead_id no localStorage (vindo do popup overlay), pular para step 2
  var existingLeadId = getLeadId();
  var existingLead = JSON.parse(localStorage.getItem('simulador_lead') || 'null');
  if (existingLeadId && existingLead && !existingLead.verified) {
    document.getElementById('leadGateStep1').style.display = 'none';
    document.getElementById('leadGateStep2').style.display = 'block';
    document.getElementById('leadGateEmailSent').textContent = existingLead.email || '';
    setTimeout(function() { document.getElementById('verifyCode').focus(); }, 100);
  }
}

// ==================== LEAD CAPTURE (popup overlay) ====================
async function handleLeadSubmit(e) {
  e.preventDefault();
  var btn = e.target.querySelector('.btn-primary');
  var nome = document.getElementById('leadName').value.trim();
  var email = document.getElementById('leadEmail').value.trim();
  var telefone = document.getElementById('leadPhone').value.trim();

  // Validação customizada
  clearFieldError('fg-leadName');
  clearFieldError('fg-leadEmail');
  clearFieldError('fg-leadPhone');
  var hasError = false;

  if (!nome || nome.length < 2) {
    setFieldError('fg-leadName', 'Preencha seu nome para continuar.');
    hasError = true;
  }
  if (!email || !validateEmail(email)) {
    setFieldError('fg-leadEmail', 'Informe um e-mail válido.');
    hasError = true;
  }
  if (!telefone || !validatePhone(telefone)) {
    setFieldError('fg-leadPhone', 'Digite um WhatsApp válido com DDD.');
    hasError = true;
  }
  if (hasError) return false;

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    var res = await fetch(API_LEAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', nome: nome, email: email, telefone: telefone })
    });
    var result = await res.json();

    if (res.ok && result.lead_id) {
      saveLeadLocal({ lead_id: result.lead_id, email: email, verified: false });
      document.getElementById('leadOverlay').classList.add('hidden');
      showLeadGateModal(function() { unlockSimulator(); });
    } else {
      showToast(result.error || 'Não foi possível concluir. Tente novamente.', 'error');
    }
  } catch(err) {
    showToast('Erro de conexão. Verifique sua internet.', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = 'Acessar Simulador <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
  return false;
}

// Botão de fechar o popup
document.getElementById('leadClose').addEventListener('click', function() {
  document.getElementById('leadOverlay').classList.add('hidden');
});

// Desbloquear simulador se lead já foi verificado
function unlockSimulator() {
  var overlay = document.getElementById('simLockOverlay');
  if (overlay) overlay.classList.add('unlocked');
}

// ===== Value-first: 1ª ação de valor é grátis; a partir da 2ª, pede cadastro =====
// O simulador fica sempre utilizável (sem bloqueio prévio nem popup por timer).
// "Ação de valor" = uma simulação que PRODUZ resultado ou um relatório CST/NBS.
var freeCreditUsed = (function () {
  try { return localStorage.getItem('simulador_free_used') === '1'; } catch (e) { return false; }
})();

// Mostra o gate quando a ação grátis já foi usada e o lead não é verificado.
// IMPORTANTE: NÃO consome o crédito aqui — só em consumeFreeCredit(), e apenas
// quando a ação realmente gera resultado (um clique em campo vazio não gasta o grátis).
function gatePending(onUnlocked) {
  if (isLeadVerified() || !freeCreditUsed) return false;
  showLeadGateModal(function () {
    unlockSimulator();
    if (typeof onUnlocked === 'function') onUnlocked();
  });
  return true;
}
function consumeFreeCredit() {
  if (!isLeadVerified()) {
    freeCreditUsed = true;
    try { localStorage.setItem('simulador_free_used', '1'); } catch (e) { /* ignore */ }
  }
}

unlockSimulator();
document.getElementById('leadOverlay').classList.add('hidden');

// Botão "Liberar Acesso Gratuito" (se exibido) abre o formulário de lead
document.getElementById('btnDesbloquear').addEventListener('click', function() {
  showLeadGateModal(function() {
    unlockSimulator();
  });
});

// ==================== TABS ====================
function showTab(tabId) {
  const ids = ['simples', 'presumido', 'real', 'cst', 'nbs'];
  document.querySelectorAll('.sim-tab').forEach((t, i) => {
    const isActive = ids[i] === tabId;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  document.querySelectorAll('.sim-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tabId).classList.add('active');
}

// ==================== TOGGLE B2B/B2C ====================
function setToggle(btn, inputId, value) {
  btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(inputId).value = value;
}

// ==================== SIMPLES NACIONAL ====================
function calcSimples() {
  if (gatePending(calcSimples)) return;
  if (_calcSimples()) consumeFreeCredit();
}
// Passo-zero: pré-preenche um cenário plausível e simula, para o usuário ver valor sem fricção.
function preencherExemploSimples() {
  var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
  set('sn-faturamento', '50.000,00');
  set('sn-rbt12', '600.000,00');
  set('sn-atividade', 'comercio');
  set('sn-folha', '8.000,00');
  set('sn-clientType', 'b2b');
  set('sn-pctB2B', '70');
  set('sn-compras', '20.000,00');
  calcSimples();
}
function _calcSimples() {
  const fat = parseCurrency(document.getElementById('sn-faturamento').value);
  const rbt12 = parseCurrency(document.getElementById('sn-rbt12').value);
  const atividade = document.getElementById('sn-atividade').value;
  const folha = parseCurrency(document.getElementById('sn-folha').value);
  const clientType = document.getElementById('sn-clientType').value;
  const pctB2B = clampPct(document.getElementById('sn-pctB2B').value) / 100;
  const compras = parseCurrency(document.getElementById('sn-compras').value);

  if (!fat || !rbt12) { showFormError('panel-simples', 'Preencha o faturamento mensal e o faturamento anual para simular.'); return; }

  // Teto do Simples Nacional (LC 123/2006, art. 3º, II): RBT12 acima de R$ 4,8M desenquadra.
  const TETO_SIMPLES = 4800000;
  if (rbt12 > TETO_SIMPLES) {
    showFormError('panel-simples', 'O faturamento anual informado (' + formatBRL(rbt12) + ') excede o teto do Simples Nacional (R$ 4.800.000,00). Sua empresa estaria desenquadrada — simule pelo Lucro Presumido ou Lucro Real.');
    return;
  }

  // ============================================================
  // LC 123/2006 (alterada pela LC 155/2016) — Tabelas oficiais
  // Valores de repartição: % do DAS que vai para cada tributo
  // Fonte: Receita Federal - Anexos I a V da LC 123/2006
  // ============================================================

  // Anexo I — Comércio
  const anexoI = [
    { max: 180000,  aliq: 4.0,  ded: 0,      pis: 2.76, cofins: 12.74, cpp: 41.5, icms: 34.0, ipi: 0, iss: 0 },
    { max: 360000,  aliq: 7.3,  ded: 5940,   pis: 2.76, cofins: 12.74, cpp: 41.5, icms: 34.0, ipi: 0, iss: 0 },
    { max: 720000,  aliq: 9.5,  ded: 13860,  pis: 2.76, cofins: 12.74, cpp: 42.0, icms: 33.5, ipi: 0, iss: 0 },
    { max: 1800000, aliq: 10.7, ded: 22500,  pis: 2.76, cofins: 12.74, cpp: 42.0, icms: 33.5, ipi: 0, iss: 0 },
    { max: 3600000, aliq: 14.3, ded: 87300,  pis: 2.76, cofins: 12.74, cpp: 42.0, icms: 33.5, ipi: 0, iss: 0 },
    { max: 4800000, aliq: 19.0, ded: 378000, pis: 6.13, cofins: 28.27, cpp: 42.10, icms: 0, ipi: 0, iss: 0 }
  ];

  // Anexo II — Indústria
  const anexoII = [
    { max: 180000,  aliq: 4.5,  ded: 0,      pis: 2.49, cofins: 11.51, cpp: 37.5, icms: 32.0, ipi: 7.5, iss: 0 },
    { max: 360000,  aliq: 7.8,  ded: 5940,   pis: 2.49, cofins: 11.51, cpp: 37.5, icms: 32.0, ipi: 7.5, iss: 0 },
    { max: 720000,  aliq: 10.0, ded: 13860,  pis: 2.49, cofins: 11.51, cpp: 37.5, icms: 32.0, ipi: 7.5, iss: 0 },
    { max: 1800000, aliq: 11.2, ded: 22500,  pis: 2.49, cofins: 11.51, cpp: 37.5, icms: 32.0, ipi: 7.5, iss: 0 },
    { max: 3600000, aliq: 14.7, ded: 85500,  pis: 2.49, cofins: 11.51, cpp: 37.5, icms: 32.0, ipi: 7.5, iss: 0 },
    { max: 4800000, aliq: 30.0, ded: 720000, pis: 4.54, cofins: 20.96, cpp: 23.5, icms: 0, ipi: 35.0, iss: 0 }
  ];

  // Anexo III — Serviços (academias, contabilidade, agências de viagem, etc.)
  const anexoIII = [
    { max: 180000,  aliq: 6.0,  ded: 0,      pis: 2.78, cofins: 12.82, cpp: 43.4, icms: 0, ipi: 0, iss: 33.5 },
    { max: 360000,  aliq: 11.2, ded: 9360,   pis: 3.05, cofins: 14.05, cpp: 43.4, icms: 0, ipi: 0, iss: 32.0 },
    { max: 720000,  aliq: 13.5, ded: 17640,  pis: 2.96, cofins: 13.64, cpp: 43.4, icms: 0, ipi: 0, iss: 32.5 },
    { max: 1800000, aliq: 16.0, ded: 35640,  pis: 2.96, cofins: 13.64, cpp: 43.4, icms: 0, ipi: 0, iss: 32.5 },
    { max: 3600000, aliq: 21.0, ded: 125640, pis: 2.78, cofins: 12.82, cpp: 43.4, icms: 0, ipi: 0, iss: 33.5 },
    { max: 4800000, aliq: 33.0, ded: 648000, pis: 3.47, cofins: 16.03, cpp: 30.5, icms: 0, ipi: 0, iss: 0 }
  ];

  // Anexo IV — Serviços (construção civil, vigilância, limpeza, advocacia)
  // ATENÇÃO: Anexo IV NÃO inclui CPP — INSS recolhido separadamente
  const anexoIV = [
    { max: 180000,  aliq: 4.5,  ded: 0,      pis: 3.83, cofins: 17.67, cpp: 0, icms: 0, ipi: 0, iss: 44.5 },
    { max: 360000,  aliq: 9.0,  ded: 8100,   pis: 4.45, cofins: 20.55, cpp: 0, icms: 0, ipi: 0, iss: 40.0 },
    { max: 720000,  aliq: 10.2, ded: 12420,  pis: 4.27, cofins: 19.73, cpp: 0, icms: 0, ipi: 0, iss: 40.0 },
    { max: 1800000, aliq: 14.0, ded: 39780,  pis: 4.10, cofins: 18.90, cpp: 0, icms: 0, ipi: 0, iss: 40.0 },
    { max: 3600000, aliq: 22.0, ded: 183780, pis: 4.10, cofins: 18.90, cpp: 0, icms: 0, ipi: 0, iss: 40.0 },
    { max: 4800000, aliq: 33.0, ded: 828000, pis: 4.45, cofins: 20.55, cpp: 0, icms: 0, ipi: 0, iss: 0 }
  ];

  // Anexo V — Serviços intelectuais (TI, engenharia, publicidade, auditoria)
  // Fator "r" (folha/faturamento) >= 28% migra para Anexo III
  const anexoV = [
    { max: 180000,  aliq: 15.5, ded: 0,      pis: 3.05, cofins: 14.10, cpp: 28.85, icms: 0, ipi: 0, iss: 14.0 },
    { max: 360000,  aliq: 18.0, ded: 4500,   pis: 3.05, cofins: 14.10, cpp: 27.85, icms: 0, ipi: 0, iss: 17.0 },
    { max: 720000,  aliq: 19.5, ded: 9900,   pis: 3.23, cofins: 14.92, cpp: 23.85, icms: 0, ipi: 0, iss: 19.0 },
    { max: 1800000, aliq: 20.5, ded: 17100,  pis: 3.41, cofins: 15.74, cpp: 23.85, icms: 0, ipi: 0, iss: 21.0 },
    { max: 3600000, aliq: 23.0, ded: 62100,  pis: 3.05, cofins: 14.10, cpp: 23.85, icms: 0, ipi: 0, iss: 23.5 },
    { max: 4800000, aliq: 30.5, ded: 540000, pis: 3.56, cofins: 16.44, cpp: 29.5, icms: 0, ipi: 0, iss: 0 }
  ];

  // Selecionar anexo conforme atividade
  const anexos = {
    'comercio': anexoI,
    'industria': anexoII,
    'servicos-iii': anexoIII,
    'servicos-iv': anexoIV,
    'servicos-v': anexoV
  };

  // Fator R para Anexo V: se folha/fat12 >= 28%, usa Anexo III
  let anexoUsado = atividade;
  if (atividade === 'servicos-v' && folha > 0) {
    const fatorR = (folha * 12) / rbt12;
    if (fatorR >= 0.28) {
      anexoUsado = 'servicos-iii';
    }
  }

  const tabela = anexos[anexoUsado] || anexoI;
  const faixa = tabela.find(f => rbt12 <= f.max) || tabela[tabela.length - 1];

  // Alíquota efetiva = ((RBT12 x Aliq) - Ded) / RBT12
  let aliqEfetiva = ((rbt12 * faixa.aliq / 100) - faixa.ded) / rbt12 * 100;
  if (aliqEfetiva < 0) aliqEfetiva = faixa.aliq;

  let impostoAtual = fat * aliqEfetiva / 100;

  // Parcela de PIS+COFINS+ICMS/ISS dentro do DAS (dados oficiais LC 123/2006)
  // Esses % representam a repartição do DAS para tributos substituíveis por IBS/CBS
  const pctPis = faixa.pis / 100;
  const pctCofins = faixa.cofins / 100;
  const pctIcms = faixa.icms / 100;
  const pctIss = faixa.iss / 100;
  const pctSubstituiveis = pctPis + pctCofins + pctIcms + pctIss;

  // Valor de PIS+COFINS+ICMS/ISS dentro do DAS atual
  let ibsCbsDentroSimples = impostoAtual * pctSubstituiveis;

  // Alíquotas IBS/CBS de referência (LC 214/2025)
  const CBS_RATE = 0.088;
  const IBS_RATE = 0.177;
  const TOTAL_IVA = CBS_RATE + IBS_RATE; // 26.5%

  // Opção: recolher IBS/CBS fora do DAS
  let ibsCbsFora = fat * TOTAL_IVA;
  let creditoCompras = compras * TOTAL_IVA;
  let ibsCbsLiquido = Math.max(0, ibsCbsFora - creditoCompras);

  // DAS residual (sem PIS+COFINS+ICMS/ISS) + IBS/CBS separado
  let impostoForaSimples = (impostoAtual - ibsCbsDentroSimples) + ibsCbsLiquido;

  // Crédito transferido ao cliente B2B
  // No Simples: crédito = alíquota efetiva x % dos tributos substituíveis
  let creditoTransfSimples = fat * (aliqEfetiva / 100) * pctSubstituiveis;
  // Com IBS/CBS fora: crédito integral na alíquota cheia
  let creditoTransfFora = fat * TOTAL_IVA;

  let economia = impostoAtual - impostoForaSimples;
  let beneficioCredito = (creditoTransfFora - creditoTransfSimples) * pctB2B;

  // Info sobre fator R (se aplicável)
  let fatorRInfo = '';
  if (atividade === 'servicos-v') {
    const fatorR = folha > 0 ? ((folha * 12) / rbt12 * 100).toFixed(1) : 0;
    fatorRInfo = `<div class="result-alert alert-info" style="margin-bottom:16px;">
      <span style="font-size:18px;">&#9432;</span>
      <div><strong>Fator R:</strong> ${fatorR}% (folha/faturamento). ${parseFloat(fatorR) >= 28 ? 'Como é >= 28%, sua empresa é tributada pelo <strong>Anexo III</strong> (mais vantajoso).' : 'Como é < 28%, sua empresa permanece no <strong>Anexo V</strong>. Aumente a folha para migrar ao Anexo III.'}</div>
    </div>`;
  }

  let recomendacao, alertClass;
  if (clientType === 'b2c' || pctB2B < 0.3) {
    recomendacao = 'Permaneça no Simples tradicional. Seus clientes são consumidores finais e não aproveitam crédito de IBS/CBS.';
    alertClass = 'alert-success';
  } else if (economia > 0 || beneficioCredito > fat * 0.02) {
    recomendacao = 'Avalie recolher IBS/CBS por fora do DAS (LC 214/2025): seus clientes B2B passam a tomar crédito integral de 26,5% (no Simples o crédito repassado é reduzido) — ganho de <strong>competitividade</strong> estimado em ' + formatBRL(beneficioCredito) + '/mês. '
      + (economia >= 0
          ? 'E ainda há economia de <strong>' + formatBRL(economia) + '/mês</strong> no imposto direto.'
          : '⚠️ Atenção: esse é um ganho <strong>indireto</strong> (competitividade), <strong>não economia de caixa</strong> — no imposto direto, recolher por fora custa ' + formatBRL(Math.abs(economia)) + '/mês a mais que continuar no Simples.');
    alertClass = 'alert-info';
  } else {
    recomendacao = 'O Simples tradicional parece mais vantajoso no seu caso. A economia com créditos não compensa a carga maior do IBS/CBS separado.';
    alertClass = 'alert-success';
  }

  // Determinar melhor opção
  const melhorOpcao = impostoForaSimples < impostoAtual ? 'fora' : 'dentro';
  const dasResidual = impostoAtual - ibsCbsDentroSimples;

  const el = document.getElementById('result-simples');
  el.innerHTML = `
    ${fatorRInfo}

    <!-- QUANTO VOCÊ PAGA HOJE -->
    <div style="background:var(--gray-100);border-radius:var(--radius);padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:20px;">&#128176;</span>
        <h4 style="margin:0;font-size:16px;color:var(--dark);">Hoje você paga no Simples (DAS)</h4>
      </div>
      <div style="font-size:32px;font-weight:900;color:var(--dark);">${formatBRL(impostoAtual)}<span style="font-size:14px;font-weight:500;color:var(--gray-500);">/mês</span></div>
      <div style="font-size:13px;color:var(--gray-500);margin-top:4px;">Alíquota efetiva: ${formatPct(aliqEfetiva)} (${anexoUsado === 'comercio' ? 'Anexo I — Comércio' : anexoUsado === 'industria' ? 'Anexo II — Indústria' : anexoUsado === 'servicos-iii' ? 'Anexo III — Serviços' : anexoUsado === 'servicos-iv' ? 'Anexo IV — Serviços' : 'Anexo V — Serviços'})</div>
    </div>

    <!-- COMPARAÇÃO: 2 CAMINHOS -->
    <h4 style="font-size:15px;color:var(--dark);margin-bottom:16px;">Com a Reforma Tributária, você tem <strong>2 caminhos</strong>:</h4>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

      <!-- OPÇÃO A: CONTINUAR NO SIMPLES -->
      <div style="background:var(--white);border:2px solid ${melhorOpcao === 'dentro' ? 'var(--success)' : 'var(--gray-300)'};border-radius:var(--radius-lg);padding:24px;position:relative;">
        ${melhorOpcao === 'dentro' ? '<div style="position:absolute;top:-10px;right:16px;background:var(--success);color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:100px;">MELHOR OPÇÃO</div>' : ''}
        <div style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Opção A — Continuar no Simples</div>
        <div style="font-size:28px;font-weight:900;color:var(--dark);">${formatBRL(impostoAtual)}<span style="font-size:13px;font-weight:500;color:var(--gray-500);">/mês</span></div>
        <div style="margin-top:16px;font-size:13px;color:var(--gray-600);line-height:1.6;">
          <div style="display:flex;align-items:start;gap:6px;margin-bottom:6px;">
            <span style="color:var(--success);font-weight:700;">&#10003;</span>
            <span>Você continua pagando tudo numa guia só (DAS)</span>
          </div>
          <div style="display:flex;align-items:start;gap:6px;margin-bottom:6px;">
            <span style="color:var(--success);font-weight:700;">&#10003;</span>
            <span>Sem mudança na rotina da empresa</span>
          </div>
          <div style="display:flex;align-items:start;gap:6px;margin-bottom:6px;">
            <span style="color:var(--danger);font-weight:700;">&#10005;</span>
            <span>Crédito reduzido para clientes empresas: <strong>${formatBRL(creditoTransfSimples)}</strong>/mês</span>
          </div>
        </div>
      </div>

      <!-- OPÇÃO B: RECOLHER POR FORA -->
      <div style="background:var(--white);border:2px solid ${melhorOpcao === 'fora' ? 'var(--success)' : 'var(--gray-300)'};border-radius:var(--radius-lg);padding:24px;position:relative;">
        ${melhorOpcao === 'fora' ? '<div style="position:absolute;top:-10px;right:16px;background:var(--success);color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:100px;">MELHOR OPÇÃO</div>' : ''}
        <div style="font-size:13px;font-weight:700;color:var(--accent-dark);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Opção B — Pagar impostos por fora</div>
        <div style="font-size:28px;font-weight:900;color:var(--dark);">${formatBRL(impostoForaSimples)}<span style="font-size:13px;font-weight:500;color:var(--gray-500);">/mês</span></div>
        <div style="margin-top:16px;font-size:13px;color:var(--gray-600);line-height:1.6;">
          <div style="display:flex;align-items:start;gap:6px;margin-bottom:6px;">
            <span style="color:var(--success);font-weight:700;">&#10003;</span>
            <span>Crédito integral para clientes empresas: <strong>${formatBRL(creditoTransfFora)}</strong>/mês</span>
          </div>
          <div style="display:flex;align-items:start;gap:6px;margin-bottom:6px;">
            <span style="color:var(--success);font-weight:700;">&#10003;</span>
            <span>Desconta impostos das suas compras (crédito amplo)</span>
          </div>
          <div style="display:flex;align-items:start;gap:6px;margin-bottom:6px;">
            <span style="color:var(--danger);font-weight:700;">&#10005;</span>
            <span>Paga 2 guias: DAS reduzido (${formatBRL(dasResidual)}) + IBS/CBS (${formatBRL(ibsCbsLiquido)})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- DIFERENÇA -->
    <div style="text-align:center;margin:20px 0;padding:16px;background:#d1fae5;border-radius:var(--radius);border:1px solid #a7f3d0;">
      <div style="font-size:13px;color:#065f46;font-weight:600;">
        ${economia >= 0
          ? 'Recolher IBS/CBS por fora te economiza <strong>' + formatBRL(Math.abs(economia)) + '/mês</strong> em imposto direto vs. continuar no Simples'
          : 'Continuar no Simples te economiza <strong>' + formatBRL(Math.abs(economia)) + '/mês</strong> em imposto direto vs. pagar por fora'
        }
      </div>
    </div>

    <!-- SEÇÃO B2B (só mostra se relevante) -->
    ${pctB2B > 0.2 ? `
    <div style="background:var(--primary-light);border:1px solid rgba(26,86,219,.2);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:18px;">&#127919;</span>
        <h5 style="margin:0;font-size:14px;color:var(--primary);">Impacto nos seus clientes empresas (B2B)</h5>
      </div>
      <p style="font-size:13px;color:var(--gray-700);line-height:1.6;margin-bottom:12px;">
        Quando você vende para <strong>outras empresas</strong>, elas podem usar o imposto da sua nota fiscal como desconto nos impostos delas. Isso se chama <strong>crédito tributário</strong>.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:var(--white);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;">Crédito no Simples</div>
          <div style="font-size:22px;font-weight:800;color:var(--gray-600);margin:4px 0;">${formatBRL(creditoTransfSimples)}</div>
          <div style="font-size:11px;color:var(--gray-400);">Seu cliente desconta isso</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;text-align:center;border:1.5px solid var(--success);">
          <div style="font-size:11px;font-weight:600;color:var(--success);text-transform:uppercase;">Crédito por fora</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin:4px 0;">${formatBRL(creditoTransfFora)}</div>
          <div style="font-size:11px;color:var(--gray-400);">Seu cliente desconta isso</div>
        </div>
      </div>
      <p style="font-size:12px;color:var(--gray-500);margin-top:10px;line-height:1.5;">
        Com crédito maior, seus clientes <strong>preferem comprar de você</strong> porque pagam menos imposto. ${beneficioCredito > 0 ? 'Benefício competitivo estimado: <strong>' + formatBRL(beneficioCredito) + '/mês</strong>.' : ''}
      </p>
    </div>
    ` : ''}

    <!-- O QUE SIGNIFICA CADA OPÇÃO -->
    <details style="border:1px solid var(--gray-300);border-radius:var(--radius);margin-bottom:16px;">
      <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:var(--dark);cursor:pointer;">Entenda cada opção em detalhes</summary>
      <div style="padding:0 18px 18px;font-size:13px;color:var(--gray-600);line-height:1.7;">
        <p><strong>Opção A — Continuar no Simples:</strong><br>
        Nada muda. Você paga uma guia mensal (DAS) de ${formatBRL(impostoAtual)} que já inclui todos os impostos: IRPJ, CSLL, PIS, COFINS, ${faixa.icms > 0 ? 'ICMS' : 'ISS'}, CPP. O valor do DAS não aumenta com a reforma.</p>

        <p style="margin-top:12px;"><strong>Opção B — Pagar IBS/CBS por fora:</strong><br>
        O seu DAS fica menor (${formatBRL(dasResidual)}) porque retira a parte de PIS, COFINS e ${faixa.icms > 0 ? 'ICMS' : 'ISS'}.
        Em troca, você paga o novo imposto IBS/CBS separado. Como o IBS/CBS tem alíquota de 26,5% sobre o faturamento (${formatBRL(ibsCbsFora)}),
        mas você desconta o IBS/CBS que pagou nas suas compras (${formatBRL(creditoCompras)}),
        o valor líquido fica em ${formatBRL(ibsCbsLiquido)}.
        Total: ${formatBRL(dasResidual)} (DAS) + ${formatBRL(ibsCbsLiquido)} (IBS/CBS) = <strong>${formatBRL(impostoForaSimples)}</strong>.</p>
      </div>
    </details>

    <!-- RECOMENDAÇÃO -->
    <div class="result-alert ${alertClass}" style="border-radius:var(--radius);">
      <span style="font-size:22px;">${alertClass === 'alert-success' ? '&#10004;' : '&#128161;'}</span>
      <div>
        <strong style="font-size:15px;">Nossa recomendação:</strong><br>
        <span style="font-size:14px;">${recomendacao}</span>
      </div>
    </div>
  `;
  el.insertAdjacentHTML('beforeend', '<p class="result-scenario-note">Estimativa no cenário do regime pleno (2033), com alíquota de referência de ~26,5%. Durante a transição (2026–2032) os valores são proporcionalmente menores.</p>' + waResultCTA());
  el.classList.add('show');
  if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return true;
}

// ==================== LUCRO PRESUMIDO ====================
function calcPresumido() {
  if (gatePending(calcPresumido)) return;
  if (_calcPresumido()) consumeFreeCredit();
}
function _calcPresumido() {
  const fat = parseCurrency(document.getElementById('lp-faturamento').value);
  const atividade = document.getElementById('lp-atividade').value;
  const compras = parseCurrency(document.getElementById('lp-compras').value);
  const clientType = document.getElementById('lp-clientType').value;
  const icmsEstado = parseFloat(document.getElementById('lp-estado').value) || 0;
  const issAliq = (parseFloat(document.getElementById('lp-iss').value) || 0) / 100;

  if (!fat) { showFormError('panel-presumido', 'Preencha o faturamento mensal para simular.'); return; }

  // PIS 0,65% + COFINS 3,00% (regime cumulativo) = 3,65% (Lei 9.718/1998)
  const PIS_COFINS_ATUAL = 0.0365;
  let impostoAtual = fat * PIS_COFINS_ATUAL;

  // ISS/ICMS — usa valores informados pelo usuário
  const issIcms = {
    comercio: { tipo: 'ICMS', aliq: icmsEstado },
    servicos: { tipo: 'ISS', aliq: issAliq },
    industria: { tipo: 'ICMS', aliq: icmsEstado },
    'transporte-cargas': { tipo: 'ICMS', aliq: 0.12 },
    'transporte-passageiros': { tipo: 'ISS', aliq: issAliq },
    'servicos-hospitalares': { tipo: 'ISS', aliq: issAliq },
    'servicos-liberais': { tipo: 'ISS', aliq: issAliq }
  };

  let dadosIssIcms = issIcms[atividade] || issIcms['comercio'];
  let impostoIssIcms = fat * dadosIssIcms.aliq;
  let totalAtual = impostoAtual + impostoIssIcms;

  // New: IBS/CBS
  const CBS_RATE = 0.088;
  const IBS_RATE = 0.177;
  const TOTAL_IVA = CBS_RATE + IBS_RATE;

  // Alíquotas reduzidas conforme LC 214/2025:
  // 60% (saúde) | 40% (transporte coletivo de passageiros intermunic./interest.) | 30% (profissionais liberais regulamentados)
  // Transporte de CARGAS não tem redução prevista → alíquota cheia.
  let aliqEfetiva = TOTAL_IVA;
  let reducaoLabel = '';
  if (atividade === 'servicos-hospitalares') {
    aliqEfetiva = TOTAL_IVA * 0.4; // redução de 60% → paga 40% da alíquota
    reducaoLabel = ' (redução de 60%)';
  } else if (atividade === 'transporte-passageiros') {
    aliqEfetiva = TOTAL_IVA * 0.6; // redução de 40% → paga 60% da alíquota
    reducaoLabel = ' (redução de 40%)';
  } else if (atividade === 'servicos-liberais') {
    aliqEfetiva = TOTAL_IVA * 0.7; // redução de 30% → paga 70% da alíquota
    reducaoLabel = ' (redução de 30%)';
  }

  let ibsCbsBruto = fat * aliqEfetiva;
  let creditoNovo = compras * aliqEfetiva;
  let ibsCbsLiquido = Math.max(0, ibsCbsBruto - creditoNovo);

  let diferenca = ibsCbsLiquido - totalAtual;
  let pctMudanca = totalAtual > 0 ? (diferenca / totalAtual * 100) : 0;

  const el = document.getElementById('result-presumido');
  el.innerHTML = `
    <!-- QUANTO PAGA HOJE -->
    <div style="background:var(--gray-100);border-radius:var(--radius);padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:20px;">&#128176;</span>
        <h4 style="margin:0;font-size:16px;color:var(--dark);">Hoje você paga em impostos sobre consumo</h4>
      </div>
      <div style="font-size:32px;font-weight:900;color:var(--dark);">${formatBRL(totalAtual)}<span style="font-size:14px;font-weight:500;color:var(--gray-500);">/mês</span></div>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:13px;color:var(--gray-500);">
        <span>PIS+COFINS: ${formatBRL(impostoAtual)}</span>
        <span>${dadosIssIcms.tipo}: ${formatBRL(impostoIssIcms)}</span>
      </div>
    </div>

    <!-- COMPARAÇÃO ANTES x DEPOIS -->
    <h4 style="font-size:15px;color:var(--dark);margin-bottom:16px;">O que muda com a Reforma Tributária:</h4>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <!-- ANTES -->
      <div style="background:var(--white);border:2px solid var(--gray-300);border-radius:var(--radius-lg);padding:24px;">
        <div style="font-size:13px;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Regime Atual</div>
        <div style="font-size:28px;font-weight:900;color:var(--dark);">${formatBRL(totalAtual)}<span style="font-size:13px;font-weight:500;color:var(--gray-500);">/mês</span></div>
        <div style="margin-top:16px;font-size:13px;color:var(--gray-600);line-height:1.6;">
          <div style="margin-bottom:6px;">PIS (0,65%) + COFINS (3%) = <strong>${formatBRL(impostoAtual)}</strong></div>
          <div style="margin-bottom:6px;">${dadosIssIcms.tipo} (${formatPct(dadosIssIcms.aliq * 100)}) = <strong>${formatBRL(impostoIssIcms)}</strong></div>
          <div style="color:var(--gray-400);font-size:12px;margin-top:8px;">Sem direito a descontar impostos das compras (regime cumulativo)</div>
        </div>
      </div>

      <!-- DEPOIS -->
      <div style="background:var(--white);border:2px solid ${diferenca <= 0 ? 'var(--success)' : 'var(--danger)'};border-radius:var(--radius-lg);padding:24px;position:relative;">
        <div style="position:absolute;top:-10px;right:16px;background:${diferenca <= 0 ? 'var(--success)' : 'var(--danger)'};color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:100px;">${diferenca <= 0 ? 'PAGA MENOS' : 'PAGA MAIS'}</div>
        <div style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Com a Reforma${reducaoLabel}</div>
        <div style="font-size:28px;font-weight:900;color:${diferenca <= 0 ? 'var(--success)' : 'var(--danger)'};">${formatBRL(ibsCbsLiquido)}<span style="font-size:13px;font-weight:500;color:var(--gray-500);">/mês</span></div>
        <div style="margin-top:16px;font-size:13px;color:var(--gray-600);line-height:1.6;">
          <div style="margin-bottom:6px;">IBS+CBS bruto (${formatPct(aliqEfetiva * 100)}) = <strong>${formatBRL(ibsCbsBruto)}</strong></div>
          <div style="margin-bottom:6px;">Desconto das compras = <strong>-${formatBRL(creditoNovo)}</strong></div>
          <div style="color:var(--success);font-size:12px;margin-top:8px;">Tudo que você compra com nota gera desconto (crédito amplo)</div>
        </div>
      </div>
    </div>

    <!-- DIFERENÇA -->
    <div style="text-align:center;margin:20px 0;padding:16px;background:${diferenca <= 0 ? '#d1fae5' : '#fee2e2'};border-radius:var(--radius);border:1px solid ${diferenca <= 0 ? '#a7f3d0' : '#fecaca'};">
      <div style="font-size:14px;color:${diferenca <= 0 ? '#065f46' : '#991b1b'};font-weight:600;">
        ${diferenca <= 0
          ? 'Sua empresa vai pagar <strong>' + formatBRL(Math.abs(diferenca)) + ' a menos</strong> por mês (' + formatPct(Math.abs(pctMudanca)) + ')'
          : 'Sua empresa vai pagar <strong>' + formatBRL(Math.abs(diferenca)) + ' a mais</strong> por mês (' + formatPct(Math.abs(pctMudanca)) + ')'
        }
      </div>
    </div>

    <!-- DETALHES -->
    <details style="border:1px solid var(--gray-300);border-radius:var(--radius);margin-bottom:16px;">
      <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:var(--dark);cursor:pointer;">Entenda o que muda na prática</summary>
      <div style="padding:0 18px 18px;font-size:13px;color:var(--gray-600);line-height:1.7;">
        <p><strong>Hoje (Lucro Presumido):</strong><br>
        Você paga PIS (0,65%) + COFINS (3%) = 3,65% sobre o faturamento, sem poder descontar impostos das suas compras. Além disso, paga ${dadosIssIcms.tipo} de ${formatPct(dadosIssIcms.aliq * 100)} sobre as vendas.</p>
        <p style="margin-top:12px;"><strong>Com a Reforma:</strong><br>
        PIS, COFINS e ${dadosIssIcms.tipo} são substituídos pelo IBS+CBS (alíquota de ${formatPct(aliqEfetiva * 100)}${reducaoLabel}).
        A grande mudança é o <strong>crédito amplo</strong>: tudo que você compra com nota fiscal gera desconto no imposto.
        Suas compras de ${formatBRL(compras)}/mês geram ${formatBRL(creditoNovo)} de crédito, reduzindo o imposto de ${formatBRL(ibsCbsBruto)} para ${formatBRL(ibsCbsLiquido)}.</p>
        ${diferenca > 0 ? '<p style="margin-top:12px;"><strong>Dica:</strong> Se o imposto aumentou, pode ser vantajoso migrar para o <strong>Lucro Real</strong>, que permite créditos mais amplos, ou aumentar suas compras com nota fiscal para gerar mais descontos.</p>' : ''}
      </div>
    </details>

    <!-- RECOMENDAÇÃO -->
    <div class="result-alert ${diferenca > 0 ? 'alert-warning' : 'alert-success'}" style="border-radius:var(--radius);">
      <span style="font-size:22px;">${diferenca > 0 ? '&#9888;' : '&#10004;'}</span>
      <div>
        <strong style="font-size:15px;">Nossa recomendação:</strong><br>
        <span style="font-size:14px;">${diferenca > 0
          ? 'Sua carga tributária tende a aumentar. Avalie migrar para o Lucro Real para aproveitar créditos amplos, ou revise sua cadeia de fornecedores para maximizar créditos de IBS/CBS.'
          : 'Boa notícia! O crédito amplo do IBS/CBS compensa a alíquota maior. Quanto mais você compra com nota fiscal, mais desconto tem no imposto.'
        }</span>
      </div>
    </div>
  `;
  el.insertAdjacentHTML('beforeend', '<p class="result-scenario-note">Estimativa no cenário do regime pleno (2033), com alíquota de referência de ~26,5%. Durante a transição (2026–2032) os valores são proporcionalmente menores.</p>' + waResultCTA());
  el.classList.add('show');
  if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return true;
}

// ==================== LUCRO REAL ====================
function calcReal() {
  if (gatePending(calcReal)) return;
  if (_calcReal()) consumeFreeCredit();
}
function _calcReal() {
  const regimePis = document.getElementById('lr-regime-pis').value;
  const fat = parseCurrency(document.getElementById('lr-faturamento').value);
  const atividade = document.getElementById('lr-atividade').value;
  const compras = parseCurrency(document.getElementById('lr-compras').value);
  const despesas = parseCurrency(document.getElementById('lr-despesas').value);
  const creditosPct = clampPct(document.getElementById('lr-creditos-pct').value) / 100;
  const reducao = clampPct(document.getElementById('lr-reducao').value) / 100;

  if (!fat) { showFormError('panel-real', 'Preencha o faturamento mensal para simular.'); return; }

  // PIS/COFINS conforme regime selecionado
  const isCumulativo = regimePis === 'cumulativo';
  const PIS_COFINS_ATUAL = isCumulativo ? 0.0365 : 0.0925;
  const regimeLabel = isCumulativo ? 'Cumulativo (3,65%)' : 'Não-Cumulativo (9,25%)';
  let pisCofinsDebito = fat * PIS_COFINS_ATUAL;
  let pisCofinsCredito = isCumulativo ? 0 : (compras + despesas) * PIS_COFINS_ATUAL * creditosPct;
  let pisCofinsLiquido = Math.max(0, pisCofinsDebito - pisCofinsCredito);

  // ICMS (commerce/industry) or ISS (services)
  let icmsIss, icmsIssLabel;
  if (atividade === 'servicos') {
    icmsIss = fat * 0.05;
    icmsIssLabel = 'ISS estimado (5% — teto, LC 116/2003)';
  } else {
    const icmsAliq = parseFloat(document.getElementById('lr-estado').value) || 0.18;
    icmsIss = fat * icmsAliq;
    // Premissa do modelo: ~80% das compras geram crédito de ICMS (aproveitamento parcial estimado).
    const APROVEITAMENTO_ICMS = 0.8;
    let icmsCredito = compras * icmsAliq * APROVEITAMENTO_ICMS;
    icmsIss = Math.max(0, icmsIss - icmsCredito);
    icmsIssLabel = 'ICMS líquido estimado (~' + formatPct(icmsAliq * 100) + ')';
  }
  let totalAtual = pisCofinsLiquido + icmsIss;

  // New: IBS/CBS with full credit
  const CBS_RATE = 0.088;
  const IBS_RATE = 0.177;
  const TOTAL_IVA = CBS_RATE + IBS_RATE;

  let aliqEfetiva = TOTAL_IVA * (1 - reducao);

  let ibsCbsDebito = fat * aliqEfetiva;
  let ibsCbsCredito = (compras + despesas) * aliqEfetiva; // full credit on everything
  let ibsCbsLiquido = Math.max(0, ibsCbsDebito - ibsCbsCredito);

  let diferenca = ibsCbsLiquido - totalAtual;
  let pctMudanca = totalAtual > 0 ? (diferenca / totalAtual * 100) : 0;

  const el = document.getElementById('result-real');
  const reducaoLabel = reducao > 0 ? ' (redução de ' + (reducao * 100) + '%)' : '';

  el.innerHTML = `
    <!-- QUANTO PAGA HOJE -->
    <div style="background:var(--gray-100);border-radius:var(--radius);padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:20px;">&#128176;</span>
        <h4 style="margin:0;font-size:16px;color:var(--dark);">Hoje você paga em impostos sobre consumo</h4>
      </div>
      <div style="font-size:32px;font-weight:900;color:var(--dark);">${formatBRL(totalAtual)}<span style="font-size:14px;font-weight:500;color:var(--gray-500);">/mês</span></div>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:13px;color:var(--gray-500);">
        <span>PIS+COFINS ${regimeLabel}: ${formatBRL(pisCofinsLiquido)}</span>
        <span>${icmsIssLabel}: ${formatBRL(icmsIss)}</span>
      </div>
    </div>

    <!-- COMPARAÇÃO ANTES x DEPOIS -->
    <h4 style="font-size:15px;color:var(--dark);margin-bottom:16px;">O que muda com a Reforma Tributária:</h4>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <!-- ANTES -->
      <div style="background:var(--white);border:2px solid var(--gray-300);border-radius:var(--radius-lg);padding:24px;">
        <div style="font-size:13px;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Regime Atual — ${regimeLabel}</div>
        <div style="font-size:28px;font-weight:900;color:var(--dark);">${formatBRL(totalAtual)}<span style="font-size:13px;font-weight:500;color:var(--gray-500);">/mês</span></div>
        <div style="margin-top:16px;font-size:13px;color:var(--gray-600);line-height:1.6;">
          <div style="margin-bottom:6px;">PIS+COFINS sobre vendas: <strong>${formatBRL(pisCofinsDebito)}</strong></div>
          ${isCumulativo
            ? '<div style="margin-bottom:6px;color:var(--gray-400);font-size:12px;">Regime cumulativo — sem direito a créditos</div>'
            : '<div style="margin-bottom:6px;">Desconto (créditos limitados): <strong>-' + formatBRL(pisCofinsCredito) + '</strong></div>'
          }
          <div style="margin-bottom:6px;">${icmsIssLabel}: <strong>${formatBRL(icmsIss)}</strong></div>
          <div style="color:var(--gray-400);font-size:12px;margin-top:8px;">${isCumulativo ? 'Sem créditos — paga sobre o faturamento total' : 'Créditos restritos — só alguns itens geram desconto'}</div>
        </div>
      </div>

      <!-- DEPOIS -->
      <div style="background:var(--white);border:2px solid ${diferenca <= 0 ? 'var(--success)' : 'var(--danger)'};border-radius:var(--radius-lg);padding:24px;position:relative;">
        <div style="position:absolute;top:-10px;right:16px;background:${diferenca <= 0 ? 'var(--success)' : 'var(--danger)'};color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:100px;">${diferenca <= 0 ? 'PAGA MENOS' : 'PAGA MAIS'}</div>
        <div style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Com a Reforma${reducaoLabel}</div>
        <div style="font-size:28px;font-weight:900;color:${diferenca <= 0 ? 'var(--success)' : 'var(--danger)'};">${formatBRL(ibsCbsLiquido)}<span style="font-size:13px;font-weight:500;color:var(--gray-500);">/mês</span></div>
        <div style="margin-top:16px;font-size:13px;color:var(--gray-600);line-height:1.6;">
          <div style="margin-bottom:6px;">IBS+CBS sobre vendas: <strong>${formatBRL(ibsCbsDebito)}</strong></div>
          <div style="margin-bottom:6px;">Desconto (crédito amplo): <strong>-${formatBRL(ibsCbsCredito)}</strong></div>
          <div style="color:var(--success);font-size:12px;margin-top:8px;">Tudo com nota gera desconto: compras, energia, aluguel, TI, serviços...</div>
        </div>
      </div>
    </div>

    <!-- DIFERENÇA -->
    <div style="text-align:center;margin:20px 0;padding:16px;background:${diferenca <= 0 ? '#d1fae5' : '#fee2e2'};border-radius:var(--radius);border:1px solid ${diferenca <= 0 ? '#a7f3d0' : '#fecaca'};">
      <div style="font-size:14px;color:${diferenca <= 0 ? '#065f46' : '#991b1b'};font-weight:600;">
        ${diferenca <= 0
          ? 'Sua empresa vai pagar <strong>' + formatBRL(Math.abs(diferenca)) + ' a menos</strong> por mês (' + formatPct(Math.abs(pctMudanca)) + ')'
          : 'Sua empresa vai pagar <strong>' + formatBRL(Math.abs(diferenca)) + ' a mais</strong> por mês (' + formatPct(Math.abs(pctMudanca)) + ')'
        }
      </div>
    </div>

    <!-- COMPARATIVO DE CRÉDITOS -->
    <div style="background:var(--primary-light);border:1px solid rgba(26,86,219,.2);border-radius:var(--radius);padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:18px;">&#128200;</span>
        <h5 style="margin:0;font-size:14px;color:var(--primary);">Seus descontos (créditos) aumentam</h5>
      </div>
      <p style="font-size:13px;color:var(--gray-700);line-height:1.6;margin-bottom:12px;">
        Hoje, só alguns itens específicos geram desconto no PIS/COFINS. Com a reforma, <strong>tudo que você compra com nota fiscal</strong> vira desconto no imposto: mercadorias, energia elétrica, aluguel, internet, software, marketing, etc.
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:var(--white);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;">Descontos Hoje</div>
          <div style="font-size:22px;font-weight:800;color:var(--gray-600);margin:4px 0;">${formatBRL(pisCofinsCredito)}</div>
          <div style="font-size:11px;color:var(--gray-400);">Créditos PIS/COFINS (limitados)</div>
        </div>
        <div style="background:var(--white);border-radius:10px;padding:14px;text-align:center;border:1.5px solid var(--success);">
          <div style="font-size:11px;font-weight:600;color:var(--success);text-transform:uppercase;">Descontos na Reforma</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin:4px 0;">${formatBRL(ibsCbsCredito)}</div>
          <div style="font-size:11px;color:var(--gray-400);">Crédito amplo IBS/CBS</div>
        </div>
      </div>
    </div>

    <!-- DETALHES -->
    <details style="border:1px solid var(--gray-300);border-radius:var(--radius);margin-bottom:16px;">
      <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:var(--dark);cursor:pointer;">Entenda o que muda na prática</summary>
      <div style="padding:0 18px 18px;font-size:13px;color:var(--gray-600);line-height:1.7;">
        <p><strong>Hoje (${regimeLabel}):</strong><br>
        ${isCumulativo
          ? 'Você paga PIS (0,65%) + COFINS (3%) = 3,65% sobre o faturamento, <strong>sem direito a créditos</strong>. Todo o valor de ' + formatBRL(pisCofinsDebito) + ' é pago integralmente.'
          : 'Você paga PIS (1,65%) + COFINS (7,6%) = 9,25% sobre o faturamento, mas pode descontar créditos de uma <strong>lista limitada</strong> de itens (insumos, energia, depreciação). Seus créditos atuais somam ' + formatBRL(pisCofinsCredito) + '/mês.'
        } Além disso, paga ${icmsIssLabel} = ${formatBRL(icmsIss)}.</p>
        <p style="margin-top:12px;"><strong>Com a Reforma:</strong><br>
        PIS, COFINS e ${atividade === 'servicos' ? 'ISS' : 'ICMS'} são substituídos pelo IBS+CBS (alíquota de ${formatPct(aliqEfetiva * 100)}${reducaoLabel}).
        O grande ganho é o <strong>crédito amplo</strong>: praticamente tudo que você compra com nota fiscal vira desconto.
        Seus créditos passam de ${formatBRL(pisCofinsCredito)} para ${formatBRL(ibsCbsCredito)}/mês — um aumento de ${pisCofinsCredito > 0 ? formatPct(((ibsCbsCredito - pisCofinsCredito) / pisCofinsCredito) * 100) : '—'}.</p>
        ${diferenca > 0 ? '<p style="margin-top:12px;"><strong>Dica:</strong> Mapeie todas as despesas com nota fiscal: energia, aluguel, telefone, internet, software, manutenção, limpeza, segurança. Cada uma gera crédito de 26,5% que reduz seu imposto.</p>' : ''}
      </div>
    </details>

    <!-- RECOMENDAÇÃO -->
    <div class="result-alert ${diferenca > 0 ? 'alert-warning' : 'alert-success'}" style="border-radius:var(--radius);">
      <span style="font-size:22px;">${diferenca > 0 ? '&#9888;' : '&#10004;'}</span>
      <div>
        <strong style="font-size:15px;">Nossa recomendação:</strong><br>
        <span style="font-size:14px;">${diferenca > 0
          ? 'Mesmo com crédito amplo, a alíquota de ' + formatPct(aliqEfetiva * 100) + ' pode resultar em carga maior para serviços com poucos insumos. Mapeie todos os custos com nota fiscal para maximizar seus descontos.'
          : 'O Lucro Real é o regime que mais se beneficia da reforma. O crédito amplo — que inclui aluguel, energia, TI e serviços — reduz significativamente sua carga tributária.'
        }</span>
      </div>
    </div>

    <p style="font-size:11px;color:var(--gray-400);margin-top:12px;line-height:1.5;">
      <strong>Premissas do modelo (Lucro Real):</strong> ISS estimado no teto de 5% (varia de 2% a 5% por município — LC 116/2003);
      crédito de ICMS estimado em 80% do imposto das compras. Valores estimados — confirme com seu contador.
    </p>
  `;
  el.insertAdjacentHTML('beforeend', '<p class="result-scenario-note">Estimativa no cenário do regime pleno (2033), com alíquota de referência de ~26,5%. Durante a transição (2026–2032) os valores são proporcionalmente menores.</p>' + waResultCTA());
  el.classList.add('show');
  if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return true;
}


let cstActiveFilter = 'todos';
let cstFiltered = [];

function renderCST(data) {
  const tbody = document.getElementById('cst-body');
  const countEl = document.getElementById('cst-count');
  cstFiltered = data;

  const tagMap = {
    'padrao': 'tag-blue',
    'reduzida': 'tag-green',
    'isento': 'tag-gray',
    'monofasico': 'tag-orange',
    'seletivo': 'tag-red'
  };

  tbody.innerHTML = data.length ? data.map((r, idx) => `
    <tr style="cursor:pointer;" onclick="showProductReportByIdx(${idx})" title="Clique para ver o relatório completo">
      <td data-label="NCM"><strong>${escapeHtml(r.ncm)}</strong></td>
      <td data-label="Descrição">${escapeHtml(r.desc)}</td>
      <td data-label="CClassTrib"><span class="tag tag-purple">${escapeHtml(r.cclass)}</span></td>
      <td data-label="Classificação"><span class="tag ${tagMap[r.categ] || 'tag-blue'}">${escapeHtml(r.classif)}</span></td>
      <td data-label="CST"><strong>${escapeHtml(r.cst)}</strong></td>
      <td data-label="Alíq. CBS">${escapeHtml(r.cbs)}</td>
      <td data-label="Alíq. IBS">${escapeHtml(r.ibs)}</td>
      <td data-label="Total 2026"><strong>${escapeHtml(r.total)}</strong></td>
    </tr>
  `).join('') : '<tr class="lookup-empty"><td colspan="8">Nenhum produto encontrado. Tente outro NCM, descrição ou código CClassTrib.</td></tr>';

  countEl.textContent = `Exibindo ${data.length} de ${cstData.length} registros — Clique no produto para ver o relatório completo`;

}

// Resolve o registro pelo índice da lista filtrada e abre o relatório (evita serializar dados no onclick)
function showProductReportByIdx(idx) {
  const r = cstFiltered[idx];
  if (!r) return;
  showProductReport(idx, r.ncm, r.desc, r.cclass, r.classif, r.cst, r.cbs, r.ibs, r.total, r.categ);
}

function filterCST() {
  if (typeof cstData === 'undefined') { loadLookupData().then(filterCST); return; }
  const q = document.getElementById('cst-search').value.toLowerCase().trim();
  let filtered = cstData;

  if (cstActiveFilter !== 'todos') {
    filtered = filtered.filter(r => r.categ === cstActiveFilter);
  }

  if (q) {
    filtered = filtered.filter(r =>
      r.ncm.includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.cclass.toLowerCase().includes(q) ||
      r.classif.toLowerCase().includes(q) ||
      r.cst.includes(q)
    );
  }

  renderCST(filtered);
}

function filterCSTCateg(btn, categ) {
  btn.parentElement.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cstActiveFilter = categ;
  filterCST();
}

// ==================== RELATÓRIO DO PRODUTO (estilo Objetiva) ====================
function showProductReport(idx, ncm, desc, cclass, classif, cst, cbs, ibs, total, categ) {
  if (gatePending(function () { showProductReport(idx, ncm, desc, cclass, classif, cst, cbs, ibs, total, categ); })) return;
  consumeFreeCredit();
  // Buscar dados completos do CClassTrib na base oficial
  const cc = cclasstribDB[cclass] || null;

  // Calcular alíquotas efetivas
  const CBS_REF = 0.9;  // teste 2026
  const IBS_REF = 0.1;  // teste 2026
  const redIbs = cc ? cc.redIbs : 0;
  const redCbs = cc ? cc.redCbs : 0;
  const ibsEfetivo = IBS_REF * (1 - redIbs / 100);
  const cbsEfetivo = CBS_REF * (1 - redCbs / 100);
  const isMonof = cc ? cc.monof : false;

  // Tags de categoria
  const categColors = {
    'padrao': { bg: '#dbeafe', color: '#1e40af', label: 'Tributação Integral' },
    'reduzida': { bg: '#d1fae5', color: '#065f46', label: 'Alíquota Reduzida' },
    'isento': { bg: '#f3f4f6', color: '#374151', label: 'Isento / Alíquota Zero' },
    'monofasico': { bg: '#fef3c7', color: '#92400e', label: 'Monofásico' },
    'seletivo': { bg: '#fee2e2', color: '#991b1b', label: 'Imposto Seletivo' }
  };
  const ct = categColors[categ] || categColors['padrao'];

  // Remover modal anterior se existir
  const prev = document.getElementById('productReportModal');
  if (prev) prev.remove();

  const modal = document.createElement('div');
  modal.className = 'report-modal-overlay';
  modal.id = 'productReportModal';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--white);border-radius:var(--radius-xl);max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:0;position:relative;animation:slideUp 0.4s ease;">

      <!-- HEADER -->
      <div style="background:var(--gray-900);color:white;padding:24px 28px;border-radius:var(--radius-xl) var(--radius-xl) 0 0;">
        <button onclick="document.getElementById('productReportModal').remove()" style="position:absolute;top:16px;right:20px;background:none;border:none;color:rgba(255,255,255,.5);font-size:24px;cursor:pointer;">&times;</button>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--accent);margin-bottom:8px;">Consulta CST, cClassTrib e Alíquota para NF em 2026</div>
        <div style="font-size:20px;font-weight:800;">${desc}</div>
        <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,.15);padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;">NCM: ${ncm}</span>
          <span style="background:${ct.bg};color:${ct.color};padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;">${ct.label}</span>
        </div>
      </div>

      <div style="padding:24px 28px;">

        <!-- CST -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Situação Tributária (CST)</div>
          <div style="display:flex;gap:12px;align-items:center;">
            <span style="background:var(--primary);color:white;font-size:18px;font-weight:800;padding:8px 16px;border-radius:10px;">${cst}</span>
            <span style="font-size:14px;color:var(--dark);font-weight:600;">${cc ? cc.cstDesc : classif}</span>
          </div>
        </div>

        <!-- CLASSIFICAÇÃO TRIBUTÁRIA -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Classificação Tributária (cClassTrib)</div>
          <div style="background:var(--gray-100);border-radius:var(--radius);padding:16px;">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">
              <span style="background:var(--primary-light);color:var(--primary);font-size:15px;font-weight:800;padding:6px 14px;border-radius:8px;">${cclass}</span>
              ${cc && cc.anexo ? '<span style="font-size:12px;color:var(--gray-500);">Anexo ' + cc.anexo + '</span>' : ''}
            </div>
            <div style="font-size:13px;color:var(--gray-700);line-height:1.5;">${cc ? cc.desc : classif}</div>
          </div>
        </div>

        <!-- ALÍQUOTAS 2026 -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Alíquotas de IBS e CBS nos Documentos Fiscais em 2026</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--gray-900);color:white;">
                <th style="padding:10px 14px;text-align:left;border-radius:8px 0 0 0;">Tributo</th>
                <th style="padding:10px 14px;text-align:center;">Alíquota Nominal</th>
                <th style="padding:10px 14px;text-align:center;">% Redução</th>
                <th style="padding:10px 14px;text-align:center;border-radius:0 8px 0 0;">Alíquota Efetiva</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:10px 14px;font-weight:600;">IBS Estadual</td>
                <td style="padding:10px 14px;text-align:center;">${isMonof ? 'Fixa' : '0,10%'}</td>
                <td style="padding:10px 14px;text-align:center;">${redIbs}%</td>
                <td style="padding:10px 14px;text-align:center;font-weight:700;">${isMonof ? ibs : ibsEfetivo.toFixed(2).replace('.', ',') + '%'}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:10px 14px;font-weight:600;">CBS</td>
                <td style="padding:10px 14px;text-align:center;">${isMonof ? 'Fixa' : '0,90%'}</td>
                <td style="padding:10px 14px;text-align:center;">${redCbs}%</td>
                <td style="padding:10px 14px;text-align:center;font-weight:700;">${isMonof ? cbs : cbsEfetivo.toFixed(2).replace('.', ',') + '%'}</td>
              </tr>
              <tr style="background:var(--gray-100);">
                <td style="padding:10px 14px;font-weight:700;">Total 2026</td>
                <td style="padding:10px 14px;text-align:center;">1,00%</td>
                <td style="padding:10px 14px;text-align:center;">—</td>
                <td style="padding:10px 14px;text-align:center;font-weight:800;font-size:15px;color:var(--primary);">${isMonof ? total : (ibsEfetivo + cbsEfetivo).toFixed(2).replace('.', ',') + '%'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${categ === 'seletivo' ? '<div class="result-alert alert-warning" style="margin-bottom:20px;"><span style="font-size:18px;">&#9888;</span><div>Este produto está sujeito ao <strong>Imposto Seletivo (IS)</strong>, que incide adicionalmente ao IBS/CBS. O IS é de incidência única (monofásica) no fabricante/importador.</div></div>' : ''}

        <!-- CAMPOS DA NOTA FISCAL -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Campos da Nota Fiscal</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Tipo de Alíquota</span>
              <span style="font-weight:600;">${cc ? cc.tipo : 'Padrão'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Redução Alíquota</span>
              <span style="font-weight:600;">${redIbs > 0 || redCbs > 0 ? 'Sim' : 'Não'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">% Redução IBS</span>
              <span style="font-weight:600;">${redIbs}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">% Redução CBS</span>
              <span style="font-weight:600;">${redCbs}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Monofásica</span>
              <span style="font-weight:600;">${isMonof ? 'Sim' : 'Não'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Diferimento</span>
              <span style="font-weight:600;">${cc && cc.difer ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </div>

        <!-- FUNDAMENTAÇÃO LEGAL -->
        ${cc && cc.url ? `
        <div>
          <a href="${cc.url}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-size:13px;font-weight:600;text-decoration:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
            Acessar Fundamentação Legal (LC 214/2025)
          </a>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== NBS / SERVICES DATA ====================
// NBS data generated from official Anexo VIII - Correlação Item/NBS/INDOP/cClassTrib IBS/CBS v1.00.00


let nbsActiveFilter = 'todos';
let nbsFiltered = [];

function renderNBS(data) {
  const tbody = document.getElementById('nbs-body');
  const countEl = document.getElementById('nbs-count');
  nbsFiltered = data;

  const categTag = {
    'padrao': 'tag-red',
    'reduzida': 'tag-green',
    'liberal': 'tag-purple',
    'especifico': 'tag-orange',
    'isento': 'tag-gray'
  };

  const categLabel = {
    'padrao': 'Alíquota Padrão',
    'reduzida': 'Alíquota Reduzida',
    'liberal': 'Profissional Liberal (-30%)',
    'especifico': 'Regime Específico',
    'isento': 'Isento / Imune'
  };

  const localTag = (l) => {
    if (!l) return 'tag-gray';
    const ll = l.toLowerCase();
    if (ll.includes('adquirente')) return 'tag-blue';
    if (ll.includes('imóvel')) return 'tag-green';
    if (ll.includes('evento')) return 'tag-purple';
    if (ll.includes('via')) return 'tag-orange';
    return 'tag-orange'; // local da prestação, entrega, etc
  };

  tbody.innerHTML = data.length ? data.map((r, idx) => `
    <tr style="cursor:pointer;" onclick="showServiceReportByIdx(${idx})" title="Clique para ver o relatório completo">
      <td data-label="Item LC 116"><strong>${escapeHtml(r.item)}</strong></td>
      <td data-label="NBS"><span class="tag tag-purple">${escapeHtml(r.nbs)}</span></td>
      <td data-label="Descrição">${escapeHtml(r.desc)}</td>
      <td data-label="Local IBS"><span class="tag ${localTag(r.local)}">${escapeHtml(r.local || '—')}</span></td>
      <td data-label="cClassTrib"><span class="tag tag-blue">${escapeHtml(r.cc)}</span></td>
      <td data-label="Classificação" style="font-size:12px;max-width:200px;">${escapeHtml(r.ccNome)}</td>
      <td data-label="Regime"><span class="tag ${categTag[r.categ] || 'tag-blue'}">${categLabel[r.categ] || escapeHtml(r.categ)}</span></td>
    </tr>`).join('') : '<tr class="lookup-empty"><td colspan="7">Nenhum serviço encontrado. Tente outro Item LC 116, código NBS ou descrição.</td></tr>';

  countEl.textContent = `Exibindo ${data.length} de ${nbsData.length} registros — Clique no serviço para ver o relatório completo`;

}

// Resolve o serviço pelo índice da lista filtrada e abre o relatório (evita serializar dados no onclick)
function showServiceReportByIdx(idx) {
  const r = nbsFiltered[idx];
  if (!r) return;
  showServiceReport(r.item, r.nbs, r.desc, r.local, r.cc, r.ccNome, r.categ);
}

// Termos populares -> fragmento técnico que aparece na base NBS (tudo minúsculo)
const NBS_SINONIMOS = {
  'advocacia': 'jurídic', 'advogado': 'jurídic', 'advogada': 'jurídic', 'advogad': 'jurídic',
  'médico': 'médic', 'medico': 'médic', 'medicina': 'saúde', 'consultório': 'saúde', 'consultorio': 'saúde',
  'clínica': 'saúde', 'clinica': 'saúde', 'hospital': 'saúde', 'enfermagem': 'saúde',
  'dentista': 'odontolog', 'odonto': 'odontolog',
  'contador': 'contábil', 'contadora': 'contábil', 'contabilidade': 'contábil', 'contabil': 'contábil',
  'engenheiro': 'engenharia', 'engenheira': 'engenharia',
  'arquiteto': 'arquitetura', 'arquiteta': 'arquitetura',
  'psicólogo': 'psicologia', 'psicologo': 'psicologia', 'psicóloga': 'psicologia',
  'professor': 'educaç', 'professora': 'educaç', 'escola': 'educaç', 'curso': 'educaç',
  'aula': 'educaç', 'faculdade': 'educaç', 'ensino': 'ensino', 'educacao': 'educaç',
  'frete': 'transporte', 'logística': 'transporte', 'logistica': 'transporte',
  'motorista': 'transporte', 'entrega': 'transporte', 'transportadora': 'transporte',
  'ti': 'software', 'dev': 'software', 'programador': 'software', 'programação': 'software',
  'programacao': 'software', 'sistema': 'software', 'informatica': 'informátic', 'informática': 'informátic',
  'marketing': 'publicit', 'propaganda': 'publicit', 'publicidade': 'publicit', 'anúncio': 'publicit', 'anuncio': 'publicit'
};

function filterNBS() {
  if (typeof nbsData === 'undefined') { loadLookupData().then(filterNBS); return; }
  const q = document.getElementById('nbs-search').value.toLowerCase().trim();
  let filtered = nbsData;

  if (nbsActiveFilter !== 'todos') {
    filtered = filtered.filter(r => r.categ === nbsActiveFilter);
  }

  if (q) {
    // Expande termos populares para a nomenclatura técnica da NBS (ex: advocacia -> jurídic)
    const terms = [q];
    for (const key in NBS_SINONIMOS) {
      if (q.includes(key)) terms.push(NBS_SINONIMOS[key]);
    }
    filtered = filtered.filter(r => terms.some(t =>
      r.item.toLowerCase().includes(t) ||
      r.nbs.toLowerCase().includes(t) ||
      r.desc.toLowerCase().includes(t) ||
      r.local.toLowerCase().includes(t) ||
      r.cc.includes(t) ||
      r.ccNome.toLowerCase().includes(t)
    ));
  }

  renderNBS(filtered);
}

function filterNBSCateg(btn, categ) {
  btn.parentElement.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  nbsActiveFilter = categ;
  filterNBS();
}

// ==================== RELATÓRIO DO SERVIÇO NBS ====================
function showServiceReport(item, nbs, desc, local, cc, ccNome, categ) {
  if (gatePending(function () { showServiceReport(item, nbs, desc, local, cc, ccNome, categ); })) return;
  consumeFreeCredit();
  // Buscar dados completos do CClassTrib na base oficial
  const ccData = cclasstribDB[cc] || null;

  const redIbs = ccData ? ccData.redIbs : 0;
  const redCbs = ccData ? ccData.redCbs : 0;
  const CBS_REF = 0.9;
  const IBS_REF = 0.1;
  const ibsEfetivo = IBS_REF * (1 - parseFloat(redIbs) / 100);
  const cbsEfetivo = CBS_REF * (1 - parseFloat(redCbs) / 100);

  const categColors = {
    'padrao': { bg: '#fee2e2', color: '#991b1b', label: 'Tributação Integral' },
    'reduzida': { bg: '#d1fae5', color: '#065f46', label: 'Alíquota Reduzida' },
    'liberal': { bg: '#ede9fe', color: '#5b21b6', label: 'Profissional Liberal (-30%)' },
    'especifico': { bg: '#fef3c7', color: '#92400e', label: 'Regime Específico' },
    'isento': { bg: '#f3f4f6', color: '#374151', label: 'Isento / Imune' }
  };
  const ct = categColors[categ] || categColors['padrao'];

  // Indicador de operação — explicação
  const localExplain = {
    'Domicílio principal do adquirente': 'O IBS é devido ao município/estado onde está o comprador do serviço.',
    'local da prestação': 'O IBS é devido ao município/estado onde o serviço é executado fisicamente.',
    'local do imóvel': 'O IBS é devido ao município/estado onde o imóvel está localizado.',
    'via explorada': 'O IBS é devido ao local onde a via (rodovia, ponte, túnel) está situada.',
  };
  const localExplanation = local ? (Object.keys(localExplain).find(k => local.toLowerCase().includes(k.toLowerCase().substring(0, 10))) ? localExplain[Object.keys(localExplain).find(k => local.toLowerCase().includes(k.toLowerCase().substring(0, 10)))] : '') : '';

  const prev = document.getElementById('serviceReportModal');
  if (prev) prev.remove();

  const modal = document.createElement('div');
  modal.className = 'report-modal-overlay';
  modal.id = 'serviceReportModal';
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--white);border-radius:var(--radius-xl);max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:0;position:relative;animation:slideUp 0.4s ease;">

      <!-- HEADER -->
      <div style="background:var(--gray-900);color:white;padding:24px 28px;border-radius:var(--radius-xl) var(--radius-xl) 0 0;">
        <button onclick="document.getElementById('serviceReportModal').remove()" style="position:absolute;top:16px;right:20px;background:none;border:none;color:rgba(255,255,255,.5);font-size:24px;cursor:pointer;">&times;</button>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--accent);margin-bottom:8px;">Consulta CST, cClassTrib e Alíquota para Serviços — NF 2026</div>
        <div style="font-size:18px;font-weight:800;line-height:1.3;">${desc}</div>
        <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,.15);padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;">Item LC 116: ${item}</span>
          <span style="background:rgba(255,255,255,.15);padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;">NBS: ${nbs}</span>
          <span style="background:${ct.bg};color:${ct.color};padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;">${ct.label}</span>
        </div>
      </div>

      <div style="padding:24px 28px;">

        <!-- CST -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Situação Tributária (CST)</div>
          <div style="display:flex;gap:12px;align-items:center;">
            <span style="background:var(--primary);color:white;font-size:18px;font-weight:800;padding:8px 16px;border-radius:10px;">${ccData ? ccData.cst : '000'}</span>
            <span style="font-size:14px;color:var(--dark);font-weight:600;">${ccData ? ccData.cstDesc : 'Tributação integral'}</span>
          </div>
        </div>

        <!-- CLASSIFICAÇÃO TRIBUTÁRIA -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Classificação Tributária (cClassTrib)</div>
          <div style="background:var(--gray-100);border-radius:var(--radius);padding:16px;">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">
              <span style="background:var(--primary-light);color:var(--primary);font-size:15px;font-weight:800;padding:6px 14px;border-radius:8px;">${cc}</span>
              ${ccData && ccData.anexo ? '<span style="font-size:12px;color:var(--gray-500);">Anexo ' + ccData.anexo + '</span>' : ''}
            </div>
            <div style="font-size:13px;color:var(--gray-700);line-height:1.5;">${ccData ? ccData.desc : ccNome}</div>
          </div>
        </div>

        <!-- LOCAL DE INCIDÊNCIA DO IBS -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Local de Incidência do IBS</div>
          <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:var(--radius);padding:16px;">
            <div style="font-size:14px;font-weight:700;color:#5b21b6;margin-bottom:4px;">${local || 'Não especificado'}</div>
            ${localExplanation ? '<div style="font-size:13px;color:#6b7280;line-height:1.5;">' + localExplanation + '</div>' : ''}
          </div>
        </div>

        <!-- ALÍQUOTAS 2026 -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Alíquotas de IBS e CBS nos Documentos Fiscais em 2026</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:var(--gray-900);color:white;">
                <th style="padding:10px 14px;text-align:left;border-radius:8px 0 0 0;">Tributo</th>
                <th style="padding:10px 14px;text-align:center;">Alíquota Nominal</th>
                <th style="padding:10px 14px;text-align:center;">% Redução</th>
                <th style="padding:10px 14px;text-align:center;border-radius:0 8px 0 0;">Alíquota Efetiva</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:10px 14px;font-weight:600;">IBS Estadual</td>
                <td style="padding:10px 14px;text-align:center;">0,10%</td>
                <td style="padding:10px 14px;text-align:center;">${redIbs}%</td>
                <td style="padding:10px 14px;text-align:center;font-weight:700;">${ibsEfetivo.toFixed(2).replace('.', ',')}%</td>
              </tr>
              <tr style="border-bottom:1px solid var(--gray-200);">
                <td style="padding:10px 14px;font-weight:600;">CBS</td>
                <td style="padding:10px 14px;text-align:center;">0,90%</td>
                <td style="padding:10px 14px;text-align:center;">${redCbs}%</td>
                <td style="padding:10px 14px;text-align:center;font-weight:700;">${cbsEfetivo.toFixed(2).replace('.', ',')}%</td>
              </tr>
              <tr style="background:var(--gray-100);">
                <td style="padding:10px 14px;font-weight:700;">Total 2026</td>
                <td style="padding:10px 14px;text-align:center;">1,00%</td>
                <td style="padding:10px 14px;text-align:center;">—</td>
                <td style="padding:10px 14px;text-align:center;font-weight:800;font-size:15px;color:var(--primary);">${(ibsEfetivo + cbsEfetivo).toFixed(2).replace('.', ',')}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${categ === 'liberal' ? '<div class="result-alert alert-info" style="margin-bottom:20px;"><span style="font-size:18px;">&#9432;</span><div>Serviço prestado por <strong>profissional liberal regulamentado</strong>. A alíquota de IBS/CBS tem redução de 30% conforme LC 214/2025, Art. 131.</div></div>' : ''}
        ${categ === 'especifico' ? '<div class="result-alert alert-warning" style="margin-bottom:20px;"><span style="font-size:18px;">&#9888;</span><div>Este serviço está sujeito a <strong>regime específico</strong> de tributação, com regras próprias definidas na LC 214/2025.</div></div>' : ''}

        <!-- CAMPOS DA NOTA FISCAL -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--gray-500);margin-bottom:8px;">Campos da Nota Fiscal de Serviços (NFS-e)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Tipo de Alíquota</span>
              <span style="font-weight:600;">${ccData ? ccData.tipo : 'Padrão'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Redução Alíquota</span>
              <span style="font-weight:600;">${parseFloat(redIbs) > 0 || parseFloat(redCbs) > 0 ? 'Sim' : 'Não'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">% Redução IBS</span>
              <span style="font-weight:600;">${redIbs}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">% Redução CBS</span>
              <span style="font-weight:600;">${redCbs}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Item LC 116</span>
              <span style="font-weight:600;">${item}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--gray-100);border-radius:8px;">
              <span style="color:var(--gray-600);">Código NBS</span>
              <span style="font-weight:600;">${nbs}</span>
            </div>
          </div>
        </div>

        <!-- O QUE MUDA PARA ESTE SERVIÇO -->
        <details style="border:1px solid var(--gray-300);border-radius:var(--radius);margin-bottom:16px;" open>
          <summary style="padding:14px 18px;font-size:14px;font-weight:600;color:var(--dark);cursor:pointer;">O que muda para este serviço com a Reforma</summary>
          <div style="padding:0 18px 18px;font-size:13px;color:var(--gray-600);line-height:1.7;">
            ${categ === 'padrao' ? '<p>Este serviço será tributado pela <strong>alíquota integral</strong> de IBS+CBS (~26,5%). Hoje ele paga ISS de 2% a 5%. Com a reforma, a alíquota sobe significativamente, mas o prestador poderá aproveitar <strong>créditos amplos</strong> de todas as compras e despesas com nota fiscal, o que pode compensar o aumento.</p>' : ''}
            ${categ === 'reduzida' ? '<p>Este serviço tem <strong>redução de ' + redIbs + '%</strong> na alíquota de IBS/CBS, resultando em uma carga efetiva menor que a alíquota padrão de 26,5%. A redução se aplica automaticamente com base no cClassTrib informado na nota fiscal.</p>' : ''}
            ${categ === 'liberal' ? '<p>Serviços prestados por <strong>profissionais liberais regulamentados</strong> (advogados, contadores, engenheiros, médicos, etc.) têm redução de 30% na alíquota de IBS/CBS. A alíquota efetiva fica em torno de 18,55% em vez de 26,5%.</p><p style="margin-top:8px;">O profissional precisa estar inscrito no respectivo conselho de classe para ter direito à redução.</p>' : ''}
            ${categ === 'especifico' ? '<p>Este serviço está sujeito a um <strong>regime específico</strong> definido na LC 214/2025, com regras próprias de base de cálculo, alíquota ou forma de recolhimento que diferem do regime geral.</p>' : ''}
            ${categ === 'isento' ? '<p>Este serviço é <strong>isento ou imune</strong> à tributação de IBS/CBS. Não há incidência do imposto sobre esta operação.</p>' : ''}
            <p style="margin-top:8px;"><strong>Local de incidência:</strong> O IBS deste serviço é recolhido ao município/estado do <strong>${local || 'conforme regra geral'}</strong>. Isso define para qual ente federativo o imposto é destinado.</p>
          </div>
        </details>

        <!-- FUNDAMENTAÇÃO LEGAL -->
        ${ccData && ccData.url ? `
        <div>
          <a href="${ccData.url}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-size:13px;font-weight:600;text-decoration:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
            Acessar Fundamentação Legal (LC 214/2025)
          </a>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== FAQ ====================
function toggleFaq(btn) {
  const isOpen = btn.parentElement.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

// ==================== INIT — lazy-load das tabelas CST/NBS ====================
// data.js (~300KB) não bloqueia o load: é injetado em idle e popula as tabelas quando pronto.
var _lookupDataPromise = null;
function loadLookupData() {
  if (typeof cstData !== 'undefined') return Promise.resolve();
  if (_lookupDataPromise) return _lookupDataPromise;
  _lookupDataPromise = new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = 'js/data.js';
    s.onload = resolve;
    s.onerror = function () { _lookupDataPromise = null; reject(new Error('Falha ao carregar tabelas')); };
    document.head.appendChild(s);
  });
  return _lookupDataPromise;
}
function initLookupTables() {
  loadLookupData().then(function () {
    renderCST(cstData);
    renderNBS(nbsData);
  }).catch(function () {
    var c = document.getElementById('cst-body');
    var n = document.getElementById('nbs-body');
    if (c) c.innerHTML = '<tr class="lookup-empty"><td colspan="8">Não foi possível carregar a tabela. Recarregue a página.</td></tr>';
    if (n) n.innerHTML = '<tr class="lookup-empty"><td colspan="7">Não foi possível carregar a tabela. Recarregue a página.</td></tr>';
  });
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(initLookupTables, { timeout: 2500 });
} else {
  setTimeout(initLookupTables, 1200);
}

// Debounced search for CST/NBS filters
document.getElementById('cst-search').addEventListener('keyup', debounce(filterCST, 300));
document.getElementById('nbs-search').addEventListener('keyup', debounce(filterNBS, 300));

// ==================== ACESSIBILIDADE & MOBILE ====================
(function () {
  // Teclado numérico no mobile para campos de valor/percentual
  document.querySelectorAll('input[oninput^="formatCurrency"], #sn-pctB2B, #lp-iss, #lr-creditos-pct')
    .forEach(function (i) { i.setAttribute('inputmode', 'decimal'); });

  // FAQ: expõe estado aberto/fechado para leitores de tela
  document.querySelectorAll('.faq-question').forEach(function (b) {
    if (!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
  });

  // Painéis do simulador como tabpanel
  document.querySelectorAll('.sim-panel').forEach(function (p) {
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('tabindex', '0');
  });

  // Navegação por seta entre as abas (padrão WAI-ARIA Tabs)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.sim-tab'));
  tabs.forEach(function (tab, idx) {
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    });
  });

  // Scroll-lock central: trava o body enquanto houver qualquer modal aberto; destrava quando não houver.
  function syncScrollLock() {
    var leadStatic = document.getElementById('leadOverlay');
    var hasModal = !!document.querySelector('.report-modal-overlay')
      || Array.prototype.slice.call(document.querySelectorAll('.lead-overlay'))
           .some(function (el) { return el.id !== 'leadOverlay'; })
      || (leadStatic && !leadStatic.classList.contains('hidden'));
    document.body.style.overflow = hasModal ? 'hidden' : '';
  }

  // Focus-trap: mantém o Tab dentro do modal e devolve o foco ao gatilho quando ele fecha (WCAG 2.4.3).
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function installFocusTrap(modal) {
    var prevFocus = document.activeElement;
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var f = Array.prototype.slice.call(modal.querySelectorAll(FOCUSABLE))
        .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    var mo = new MutationObserver(function () {
      if (!document.body.contains(modal)) {
        document.removeEventListener('keydown', onKey, true);
        mo.disconnect();
        if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
      }
    });
    mo.observe(document.body, { childList: true });
  }

  // Fecha modal/overlay com Esc (lead gate dinâmico, popup estático e relatórios CST/NBS)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var report = document.querySelector('.report-modal-overlay');
    if (report) { report.remove(); syncScrollLock(); return; }
    var dyn = Array.prototype.slice.call(document.querySelectorAll('.lead-overlay'))
      .find(function (el) { return el.id !== 'leadOverlay'; });
    if (dyn) { dyn.remove(); syncScrollLock(); return; }
    var overlay = document.getElementById('leadOverlay');
    if (overlay && !overlay.classList.contains('hidden')) { overlay.classList.add('hidden'); syncScrollLock(); }
  });

  // Foco no 1º campo quando o popup estático abre + scroll-lock
  var staticOverlay = document.getElementById('leadOverlay');
  if (staticOverlay && window.MutationObserver) {
    new MutationObserver(function () {
      if (!staticOverlay.classList.contains('hidden')) {
        var f = staticOverlay.querySelector('input');
        if (f) f.focus();
      }
      syncScrollLock();
    }).observe(staticOverlay, { attributes: true, attributeFilter: ['class'] });
  }

  // Modais dinâmicos (lead gate + relatórios CST/NBS): role de diálogo, foco, OTP e scroll-lock
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.slice.call(m.addedNodes).forEach(function (n) {
          if (n.nodeType !== 1 || !n.classList) return;
          if (n.classList.contains('lead-overlay') && n.id !== 'leadOverlay') {
            var card = n.querySelector('.lead-card') || n;
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-modal', 'true');
            var otp = n.querySelector('#verifyCode');
            if (otp) otp.setAttribute('inputmode', 'numeric');
            var fld = n.querySelector('input');
            if (fld) setTimeout(function () { fld.focus(); }, 50);
            installFocusTrap(n);
          } else if (n.classList.contains('report-modal-overlay')) {
            var rcard = n.firstElementChild || n;
            rcard.setAttribute('role', 'dialog');
            rcard.setAttribute('aria-modal', 'true');
            rcard.setAttribute('aria-label', 'Relatório do item');
            n.querySelectorAll('button').forEach(function (b) {
              if (!b.getAttribute('aria-label') && /^[×✕✖x]$/i.test(b.textContent.trim())) {
                b.setAttribute('aria-label', 'Fechar');
              }
            });
            installFocusTrap(n);
          }
        });
      });
      syncScrollLock();
    }).observe(document.body, { childList: true });
  }
})();
