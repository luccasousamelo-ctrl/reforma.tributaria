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
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPct(n) {
  return n.toFixed(2).replace('.', ',') + '%';
}

// ==================== DEBOUNCE ====================
function debounce(fn, delay) {
  let timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

// ==================== LEAD GATE ====================
function isLeadCaptured() {
  return !!localStorage.getItem('leads');
}

function guardLeadGate(callback) {
  if (isLeadCaptured()) {
    callback();
    return true;
  }
  showLeadGateModal(callback);
  return false;
}

function showLeadGateModal(callback) {
  // Se já existe um modal, remove
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
    '<h2>Cadastre-se e <span>simule gratuitamente</span></h2>' +
    '<p class="lead-sub">Sem custos. Acesso completo a todas as simulações e tabelas.</p>' +
    '<form id="leadGateForm">' +
      '<div class="form-group">' +
        '<label for="gateName">Nome completo</label>' +
        '<input type="text" id="gateName" placeholder="Seu nome" required autocomplete="name">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="gateEmail">E-mail</label>' +
        '<input type="email" id="gateEmail" placeholder="seu@empresa.com.br" required autocomplete="email">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="gatePhone">WhatsApp</label>' +
        '<input type="tel" id="gatePhone" placeholder="(11) 99999-9999" required autocomplete="tel">' +
      '</div>' +
      '<button type="submit" class="btn-primary">' +
        'Liberar Acesso Gratuito' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</button>' +
    '</form>' +
    '<div class="lead-trust">' +
      '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Dados protegidos</span>' +
      '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 100% gratuito</span>' +
      '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> +12.000 empresas</span>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modal);

  document.getElementById('leadGateForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var data = {
      name: document.getElementById('gateName').value,
      email: document.getElementById('gateEmail').value,
      phone: document.getElementById('gatePhone').value,
      timestamp: new Date().toISOString()
    };
    var leads = JSON.parse(localStorage.getItem('leads') || '[]');
    leads.push(data);
    localStorage.setItem('leads', JSON.stringify(leads));
    modal.remove();
    if (callback) callback();
  });
}

// ==================== LEAD CAPTURE ====================
async function handleLeadSubmit(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('leadName').value,
    email: document.getElementById('leadEmail').value,
    phone: document.getElementById('leadPhone').value,
    timestamp: new Date().toISOString()
  };

  // Store lead locally
  const leads = JSON.parse(localStorage.getItem('leads') || '[]');
  leads.push(data);
  localStorage.setItem('leads', JSON.stringify(leads));

  // Fechar overlay e desbloquear simulador
  document.getElementById('leadOverlay').classList.add('hidden');
  unlockSimulator();

  return false;
}

// Botão de fechar o popup
document.getElementById('leadClose').addEventListener('click', function() {
  document.getElementById('leadOverlay').classList.add('hidden');
});

// Desbloquear simulador se lead já foi capturado
function unlockSimulator() {
  var overlay = document.getElementById('simLockOverlay');
  if (overlay) overlay.classList.add('unlocked');
}

if (isLeadCaptured()) {
  unlockSimulator();
  document.getElementById('leadOverlay').classList.add('hidden');
} else {
  // Popup com timer para quem navega sem cadastrar
  setTimeout(function() {
    document.getElementById('leadOverlay').classList.remove('hidden');
  }, 5000);
}

// Botão "Desbloquear Simulador" abre o formulário de lead
document.getElementById('btnDesbloquear').addEventListener('click', function() {
  showLeadGateModal(function() {
    unlockSimulator();
  });
});

// ==================== TABS ====================
function showTab(tabId) {
  document.querySelectorAll('.sim-tab').forEach((t, i) => {
    const ids = ['simples', 'presumido', 'real', 'cst', 'nbs'];
    t.classList.toggle('active', ids[i] === tabId);
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
  _calcSimples();
}
function _calcSimples() {
  const fat = parseCurrency(document.getElementById('sn-faturamento').value);
  const rbt12 = parseCurrency(document.getElementById('sn-rbt12').value);
  const atividade = document.getElementById('sn-atividade').value;
  const folha = parseCurrency(document.getElementById('sn-folha').value);
  const clientType = document.getElementById('sn-clientType').value;
  const pctB2B = parseFloat(document.getElementById('sn-pctB2B').value) / 100;
  const compras = parseCurrency(document.getElementById('sn-compras').value);

  if (!fat || !rbt12) { alert('Preencha o faturamento mensal e anual.'); return; }

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
    recomendacao = 'Considere recolher IBS/CBS por fora do DAS (LC 214/2025). Seus clientes B2B terão crédito integral de 26,5%, tornando você mais competitivo. Benefício estimado: ' + formatBRL(economia + beneficioCredito) + '/mês.';
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
    <div style="text-align:center;margin:20px 0;padding:16px;background:${economia >= 0 ? '#d1fae5' : '#fee2e2'};border-radius:var(--radius);border:1px solid ${economia >= 0 ? '#a7f3d0' : '#fecaca'};">
      <div style="font-size:13px;color:${economia >= 0 ? '#065f46' : '#991b1b'};font-weight:600;">
        ${economia >= 0
          ? 'Continuar no Simples te economiza <strong>' + formatBRL(Math.abs(economia)) + '/mês</strong>'
          : 'Pagar por fora te economiza <strong>' + formatBRL(Math.abs(economia)) + '/mês</strong>'
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
  el.classList.add('show');
}

// ==================== LUCRO PRESUMIDO ====================
function calcPresumido() {
  _calcPresumido();
}
function _calcPresumido() {
  const fat = parseCurrency(document.getElementById('lp-faturamento').value);
  const atividade = document.getElementById('lp-atividade').value;
  const compras = parseCurrency(document.getElementById('lp-compras').value);
  const clientType = document.getElementById('lp-clientType').value;
  const icmsEstado = parseFloat(document.getElementById('lp-estado').value);
  const issAliq = parseFloat(document.getElementById('lp-iss').value) / 100;

  if (!fat) { alert('Preencha o faturamento mensal.'); return; }

  // PIS 0,65% + COFINS 3,00% (cumulativo) = 3,65% (LC 9.718/98 e LC 10.833/03)
  const PIS_COFINS_ATUAL = 0.0365;
  let impostoAtual = fat * PIS_COFINS_ATUAL;

  // ISS/ICMS — usa valores informados pelo usuário
  const issIcms = {
    comercio: { tipo: 'ICMS', aliq: icmsEstado },
    servicos: { tipo: 'ISS', aliq: issAliq },
    industria: { tipo: 'ICMS', aliq: icmsEstado },
    'transporte-cargas': { tipo: 'ICMS', aliq: 0.12 },
    'transporte-passageiros': { tipo: 'ISS', aliq: issAliq },
    'servicos-hospitalares': { tipo: 'ISS', aliq: issAliq }
  };

  let dadosIssIcms = issIcms[atividade] || issIcms['comercio'];
  let impostoIssIcms = fat * dadosIssIcms.aliq;
  let totalAtual = impostoAtual + impostoIssIcms;

  // New: IBS/CBS
  const CBS_RATE = 0.088;
  const IBS_RATE = 0.177;
  const TOTAL_IVA = CBS_RATE + IBS_RATE;

  // Check reduced rates
  let aliqEfetiva = TOTAL_IVA;
  let reducaoLabel = '';
  if (atividade === 'servicos-hospitalares') {
    aliqEfetiva = TOTAL_IVA * 0.4; // 60% reduction
    reducaoLabel = ' (redução de 60%)';
  } else if (atividade === 'transporte-cargas' || atividade === 'transporte-passageiros') {
    aliqEfetiva = TOTAL_IVA * 0.4;
    reducaoLabel = ' (redução de 60%)';
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
  el.classList.add('show');
}

// ==================== LUCRO REAL ====================
function calcReal() {
  _calcReal();
}
function _calcReal() {
  const regimePis = document.getElementById('lr-regime-pis').value;
  const fat = parseCurrency(document.getElementById('lr-faturamento').value);
  const atividade = document.getElementById('lr-atividade').value;
  const compras = parseCurrency(document.getElementById('lr-compras').value);
  const despesas = parseCurrency(document.getElementById('lr-despesas').value);
  const creditosPct = parseFloat(document.getElementById('lr-creditos-pct').value) / 100;
  const reducao = parseFloat(document.getElementById('lr-reducao').value) / 100;

  if (!fat) { alert('Preencha o faturamento mensal.'); return; }

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
    icmsIssLabel = 'ISS (5%)';
  } else {
    icmsIss = fat * 0.18;
    let icmsCredito = compras * 0.18 * 0.8;
    icmsIss = Math.max(0, icmsIss - icmsCredito);
    icmsIssLabel = 'ICMS líquido (~18%)';
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
  `;
  el.classList.add('show');
}


let cstActiveFilter = 'todos';

function renderCST(data) {
  const tbody = document.getElementById('cst-body');
  const countEl = document.getElementById('cst-count');

  const tagMap = {
    'padrao': 'tag-blue',
    'reduzida': 'tag-green',
    'isento': 'tag-gray',
    'monofasico': 'tag-orange',
    'seletivo': 'tag-red'
  };

  tbody.innerHTML = data.map((r, idx) => `
    <tr style="cursor:pointer;" onclick="showProductReport(${idx}, '${r.ncm}', '${r.desc.replace(/'/g,"\\'")}', '${r.cclass}', '${r.classif.replace(/'/g,"\\'")}', '${r.cst}', '${r.cbs}', '${r.ibs}', '${r.total}', '${r.categ}')" title="Clique para ver o relatório completo">
      <td><strong>${r.ncm}</strong></td>
      <td>${r.desc}</td>
      <td><span class="tag tag-purple">${r.cclass}</span></td>
      <td><span class="tag ${tagMap[r.categ] || 'tag-blue'}">${r.classif}</span></td>
      <td><strong>${r.cst}</strong></td>
      <td>${r.cbs}</td>
      <td>${r.ibs}</td>
      <td><strong>${r.total}</strong></td>
    </tr>
  `).join('');

  countEl.textContent = `Exibindo ${data.length} de ${cstData.length} registros — Clique no produto para ver o relatório completo`;

}

function filterCST() {
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

function renderNBS(data) {
  const tbody = document.getElementById('nbs-body');
  const countEl = document.getElementById('nbs-count');

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

  tbody.innerHTML = data.map(r => {
    const safeDesc = r.desc.replace(/'/g, "\\'");
    const safeLocal = (r.local || '').replace(/'/g, "\\'");
    const safeCcNome = r.ccNome.replace(/'/g, "\\'");
    return `
    <tr style="cursor:pointer;" onclick="showServiceReport('${r.item}','${r.nbs}','${safeDesc}','${safeLocal}','${r.cc}','${safeCcNome}','${r.categ}')" title="Clique para ver o relatório completo">
      <td><strong>${r.item}</strong></td>
      <td><span class="tag tag-purple">${r.nbs}</span></td>
      <td>${r.desc}</td>
      <td><span class="tag ${localTag(r.local)}">${r.local || '—'}</span></td>
      <td><span class="tag tag-blue">${r.cc}</span></td>
      <td style="font-size:12px;max-width:200px;">${r.ccNome}</td>
      <td><span class="tag ${categTag[r.categ] || 'tag-blue'}">${categLabel[r.categ] || r.categ}</span></td>
    </tr>`;
  }).join('');

  countEl.textContent = `Exibindo ${data.length} de ${nbsData.length} registros — Clique no serviço para ver o relatório completo`;

}

function filterNBS() {
  const q = document.getElementById('nbs-search').value.toLowerCase().trim();
  let filtered = nbsData;

  if (nbsActiveFilter !== 'todos') {
    filtered = filtered.filter(r => r.categ === nbsActiveFilter);
  }

  if (q) {
    filtered = filtered.filter(r =>
      r.item.toLowerCase().includes(q) ||
      r.nbs.toLowerCase().includes(q) ||
      r.desc.toLowerCase().includes(q) ||
      r.local.toLowerCase().includes(q) ||
      r.cc.includes(q) ||
      r.ccNome.toLowerCase().includes(q)
    );
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
  btn.parentElement.classList.toggle('open');
}

// ==================== INIT ====================
renderCST(cstData);
renderNBS(nbsData);

// Debounced search for CST/NBS filters
document.getElementById('cst-search').addEventListener('keyup', debounce(filterCST, 300));
document.getElementById('nbs-search').addEventListener('keyup', debounce(filterNBS, 300));
