const TOKEN_KEY = "nexus_admin_token";
const LICENSE_STORAGE_KEY = "nexus_full_licenses";

const loginView = document.querySelector("#loginView");
const adminView = document.querySelector("#adminView");
const loginForm = document.querySelector("#adminLoginForm");
const licenseForm = document.querySelector("#licenseForm");
const licenseList = document.querySelector("#licenseList");
const summaryText = document.querySelector("#summaryText");
const createPanel = document.querySelector("#createPanel");
const licensesPanel = document.querySelector("#licensesPanel");
const customersPanel = document.querySelector("#customersPanel");
const createdLicense = document.querySelector("#createdLicense");
const customerForm = document.querySelector("#customerForm");
const customerList = document.querySelector("#customerList");
const customersSummary = document.querySelector("#customersSummary");
const licenseCustomerSelect = document.querySelector("#licenseCustomerSelect");
const toast = document.querySelector("#toast");
const metricCustomers = document.querySelector("#metricCustomers");
const metricTotal = document.querySelector("#metricTotal");
const metricActive = document.querySelector("#metricActive");
const metricMachines = document.querySelector("#metricMachines");
const siteModal = document.querySelector("#siteModal");
const siteModalTitle = document.querySelector("#siteModalTitle");
const siteModalBody = document.querySelector("#siteModalBody");
const siteModalCancel = document.querySelector("#siteModalCancel");
const siteModalConfirm = document.querySelector("#siteModalConfirm");
const siteModalClose = document.querySelector("#siteModalClose");

let token = localStorage.getItem(TOKEN_KEY) || "";
let customers = [];

// ===== ARMAZENAMENTO DE CHAVES COMPLETAS =====
function saveFullLicense(licenseKey, fullKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(LICENSE_STORAGE_KEY) || '{}');
    stored[licenseKey] = fullKey;
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn('Não foi possível salvar a chave completa:', e);
  }
}

function getFullLicense(licenseKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(LICENSE_STORAGE_KEY) || '{}');
    return stored[licenseKey] || licenseKey;
  } catch (e) {
    return licenseKey;
  }
}

function getAllFullLicenses() {
  try {
    return JSON.parse(localStorage.getItem(LICENSE_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

// ===== BACK TO TOP =====
const backToTopBtn = document.getElementById('backToTop');
let isVisible = false;

window.addEventListener('scroll', function() {
  const scrollY = window.scrollY || window.pageYOffset;
  const threshold = 400;
  
  if (scrollY > threshold && !isVisible) {
    backToTopBtn.classList.add('visible');
    isVisible = true;
  } else if (scrollY <= threshold && isVisible) {
    backToTopBtn.classList.remove('visible');
    isVisible = false;
  }
});

backToTopBtn?.addEventListener('click', function() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// ===== FUNÇÃO COPIAR =====
function copyToClipboard(text, element) {
  if (!text) {
    showToast('Nada para copiar', 'warning');
    return;
  }
  
  // Se o texto estiver mascarado com ****, tenta recuperar a chave completa do storage
  if (text.includes('****')) {
    const fullKey = getFullLicense(text);
    if (fullKey && !fullKey.includes('****')) {
      text = fullKey;
    }
  }
  
  // Se ainda tiver ****, tenta do dataset
  if (text.includes('****') && element) {
    const fullKey = element.dataset.fullLicense;
    if (fullKey && !fullKey.includes('****')) {
      text = fullKey;
    }
  }
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback(element);
      showToast('Chave copiada!', 'success');
    }).catch(() => {
      fallbackCopy(text, element);
    });
  } else {
    fallbackCopy(text, element);
  }
}

function fallbackCopy(text, element) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showCopyFeedback(element);
    showToast('Chave copiada!', 'success');
  } catch (err) {
    showToast('Não foi possível copiar', 'error');
  }
  document.body.removeChild(textarea);
}

function showCopyFeedback(element) {
  if (!element) return;
  const originalHtml = element.innerHTML;
  element.innerHTML = '<i class="fa-regular fa-check"></i> Copiado!';
  element.classList.add('copied');
  
  setTimeout(() => {
    element.innerHTML = originalHtml;
    element.classList.remove('copied');
  }, 2000);
}

// ===== TOAST =====
function showToast(message, type = "info") {
  if (!toast) return;
  
  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#0e75ed'
  };
  
  toast.textContent = message;
  toast.style.background = colors[type] || colors.info;
  toast.className = 'toast ' + type;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function showSiteAlert(title, message, type = "info") {
  return new Promise((resolve) => {
    openSiteModal(title, message, type, false, "OK", resolve);
  });
}

function showSiteConfirm(title, message, confirmText = "Confirmar", type = "warning") {
  return new Promise((resolve) => {
    openSiteModal(title, message, type, true, confirmText, resolve);
  });
}

function openSiteModal(title, message, type, cancellable, confirmText, resolve) {
  if (!siteModal) {
    resolve(window.confirm(message));
    return;
  }
  const icon = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  }[type] || "fa-circle-info";
  siteModalTitle.textContent = title;
  siteModalBody.innerHTML = `
    <div class="modal-alert ${type}">
      <i class="fa-solid ${icon}"></i>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  siteModalConfirm.textContent = confirmText;
  siteModalCancel.hidden = !cancellable;
  siteModal.hidden = false;

  const finish = (value) => {
    siteModal.hidden = true;
    siteModalConfirm.onclick = null;
    siteModalCancel.onclick = null;
    siteModalClose.onclick = null;
    resolve(value);
  };
  siteModalConfirm.onclick = () => finish(true);
  siteModalCancel.onclick = () => finish(false);
  siteModalClose.onclick = () => finish(false);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Erro na requisicao.");
  }
  return data;
}

function setLoggedIn(value) {
  if (loginView) loginView.hidden = value;
  if (adminView) adminView.hidden = !value;
  if (value) refreshAll();
}

function formatDate(value) {
  if (!value) return "Sem validade";
  return new Date(value).toLocaleString("pt-BR");
}

function statusLabel(status) {
  const labels = {
    active: "Ativa",
    suspended: "Suspensa",
    expired: "Expirada"
  };
  return labels[status] || status;
}

function activeActivations(license) {
  return license.activations.filter((activation) => !activation.revokedAt);
}

function renderMetrics(licenses) {
  setText(metricCustomers, customers.length);
  setText(metricTotal, licenses.length);
  setText(metricActive, licenses.filter((license) => license.status === "active").length);
  setText(metricMachines, licenses.reduce((total, license) => total + activeActivations(license).length, 0));
}

function renderCustomers() {
  setText(customersSummary, `${customers.length} cliente(s)`);
  setText(metricCustomers, customers.length);
  if (licenseCustomerSelect) {
    licenseCustomerSelect.innerHTML = `<option value="">Selecionar cliente</option>` + customers.map((customer) => (
      `<option value="${customer.id}">${escapeHtml(customer.name)}${customer.company ? ` - ${escapeHtml(customer.company)}` : ""}</option>`
    )).join("");
  }

  if (!customers.length) {
    if (customerList) customerList.innerHTML = `<div class="license-card">Nenhum cliente cadastrado.</div>`;
    return;
  }

  if (customerList) customerList.innerHTML = customers.map((customer) => `
    <article class="license-card customer-card">
      <div class="license-card-header">
        <div class="license-title">
          <strong>${escapeHtml(customer.name)}</strong>
          <span>${escapeHtml(customer.company || "Sem empresa")} - ${escapeHtml(customer.email || "Sem e-mail")}</span>
          <span class="license-meta">
            ${escapeHtml(customer.phone || "Sem telefone")} - ${escapeHtml([customer.city, customer.state].filter(Boolean).join("/")) || "Sem cidade"}
            - Licencas: ${(customer.licenses || []).length}
          </span>
        </div>
        <div class="license-actions">
          <span class="status ${customer.status === "active" ? "active" : "expired"}">${customer.status === "active" ? "Ativo" : "Inativo"}</span>
          <button class="mini-button" data-customer-action="edit" data-id="${customer.id}">Editar</button>
          <button class="mini-button" data-customer-action="license" data-id="${customer.id}">Criar licença</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderLicenses(licenses) {
  setText(summaryText, `${licenses.length} licenca(s)`);
  renderMetrics(licenses);

  if (!licenses.length) {
    if (licenseList) licenseList.innerHTML = `<div class="license-card">Nenhuma licenca cadastrada.</div>`;
    return;
  }

  if (licenseList) {
    licenseList.innerHTML = licenses.map((license) => {
      // PEGAR A CHAVE - PRIORIZA licenseKey, DEPOIS licenseKeyLabel
      let licenseKey = license.licenseKey || license.licenseKeyLabel || 'Chave não disponível';
      
      // TENTAR RECUPERAR A CHAVE COMPLETA DO STORAGE LOCAL
      const fullKeyFromStorage = getFullLicense(licenseKey);
      if (fullKeyFromStorage && !fullKeyFromStorage.includes('****')) {
        licenseKey = fullKeyFromStorage;
      }
      
      // Se ainda tiver ****, tenta do campo raw
      if (licenseKey.includes('****') && license.licenseKeyRaw) {
        licenseKey = license.licenseKeyRaw;
      }
      
      return `
      <article class="license-card">
        <div class="license-card-header">
          <div class="license-title">
            <strong>${escapeHtml(license.customerName)}</strong>
            <span>${escapeHtml(license.customerEmail || "Sem e-mail")}</span>
            <span class="license-meta">
              Plano: ${escapeHtml(license.plan)} - Validade: ${formatDate(license.expiresAt)} -
              Ativacoes: ${activeActivations(license).length}/${license.maxActivations}
            </span>
            <div class="license-key-wrapper">
              <code class="license-key-full">${escapeHtml(licenseKey)}</code>
              <button class="copy-key-btn" 
                      data-license="${escapeHtml(licenseKey)}" 
                      data-full-license="${escapeHtml(licenseKey)}"
                      title="Copiar chave">
                <i class="fa-regular fa-copy"></i> Copiar
              </button>
            </div>
          </div>
          <div class="license-actions">
            <span class="status ${license.status}">${statusLabel(license.status)}</span>
            ${license.status === "active"
              ? `<button class="mini-button" data-action="suspend" data-id="${license.id}">Suspender</button>`
              : `<button class="mini-button" data-action="activate" data-id="${license.id}">Ativar</button>`}
            <button class="mini-button" data-action="renew" data-id="${license.id}">Renovar +1 ano</button>
            <button class="mini-button danger" data-action="delete" data-id="${license.id}">Excluir</button>
          </div>
        </div>
        <div class="activation-list">
          ${license.activations && license.activations.length ? license.activations.map((activation) => `
            <div class="activation-row">
              <span>
                ${escapeHtml(activation.machineLabel || "Computador sem nome")}
                - Versao ${escapeHtml(activation.appVersion || "-")}
                - ultimo acesso ${formatDate(activation.lastSeenAt)}
                ${activation.revokedAt ? " - revogada" : ""}
              </span>
              ${activation.revokedAt
                ? ""
                : `<button class="mini-button danger" data-action="revoke" data-id="${activation.id}">Revogar maquina</button>`}
            </div>
          `).join("") : `<span>Nenhuma maquina ativada.</span>`}
        </div>
      </article>
    `}).join("");

    // Adicionar eventos de cópia
    document.querySelectorAll('.copy-key-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Usar o full-license se disponível, senão o license
        const licenseKey = this.dataset.fullLicense || this.dataset.license;
        copyToClipboard(licenseKey, this);
      });
    });
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setText(node, value) {
  if (node) node.textContent = value;
}

async function loadLicenses() {
  setText(summaryText, "Carregando...");
  if (licenseList) licenseList.innerHTML = "";
  try {
    const data = await api("/api/admin/licenses");
    renderLicenses(data.licenses || []);
  } catch (error) {
    showToast(error.message, "error");
    if (/negado|sessao|token|expir/i.test(error.message)) {
      localStorage.removeItem(TOKEN_KEY);
      token = "";
      setLoggedIn(false);
    }
  }
}

async function loadCustomers() {
  try {
    const data = await api("/api/admin/customers");
    customers = data.customers || [];
    renderCustomers();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function refreshAll() {
  try {
    await loadCustomers();
    await loadLicenses();
  } catch (error) {
    showToast(error.message, "error");
    if (/negado|sessao|token|expir/i.test(error.message)) {
      localStorage.removeItem(TOKEN_KEY);
      token = "";
      setLoggedIn(false);
    }
  }
}

async function runAction(action, payload = {}) {
  try {
    await api("/api/admin/license-action", {
      method: "POST",
      body: JSON.stringify({ action, ...payload })
    });
    await loadLicenses();
    showToast('Ação realizada com sucesso!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ===== LOGIN =====
loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "Usuario ou senha invalidos.");
    token = data.token;
    localStorage.setItem(TOKEN_KEY, token);
    setLoggedIn(true);
    showToast('Login realizado com sucesso!', 'success');
  } catch (error) {
    showToast(error.message, "error");
  }
});

// ===== CREATE LICENSE =====
licenseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(licenseForm);
  const payload = Object.fromEntries(formData.entries());
  if (!payload.expiresAt) delete payload.expiresAt;

  try {
    const data = await api("/api/admin/licenses", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    
    // SALVAR A CHAVE COMPLETA NO STORAGE LOCAL
    const fullLicenseKey = data.licenseKey || data.licenseKeyLabel || 'Chave gerada';
    const maskedKey = fullLicenseKey.replace(/(NEXUS-)([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{5})/, '$1****-****-****-$5');
    
    // Salvar a chave completa associada à versão mascarada
    if (fullLicenseKey && !fullLicenseKey.includes('****')) {
      saveFullLicense(fullLicenseKey, fullLicenseKey);
      // Também salvar pela versão mascarada
      if (maskedKey !== fullLicenseKey) {
        saveFullLicense(maskedKey, fullLicenseKey);
      }
    }
    
    if (createdLicense) {
      createdLicense.hidden = false;
      const keyDisplay = document.getElementById("licenseKeyDisplay");
      if (keyDisplay) {
        // Mostrar a chave completa na criação
        const displayKey = fullLicenseKey.includes('****') ? fullLicenseKey : fullLicenseKey;
        keyDisplay.textContent = displayKey;
        
        // Adicionar botão de copiar na licença gerada
        const existingBtn = keyDisplay.parentNode.querySelector('.copy-key-btn');
        if (existingBtn) existingBtn.remove();
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-key-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
        copyBtn.dataset.license = displayKey;
        copyBtn.dataset.fullLicense = fullLicenseKey;
        copyBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          copyToClipboard(this.dataset.fullLicense || this.dataset.license, this);
        });
        keyDisplay.parentNode.appendChild(copyBtn);
      }
    }
    licenseForm.reset();
    licenseForm.elements.plan.value = "standard";
    licenseForm.elements.maxActivations.value = "1";
    showToast("Licença criada com sucesso!", "success");
    await loadLicenses();
  } catch (error) {
    showToast(error.message, "error");
  }
});

// ===== LICENSE ACTIONS =====
licenseList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  try {
    if (action === "suspend") {
      if (await showSiteConfirm("Suspender licença", "Deseja suspender esta licença?", "Suspender", "warning")) {
        await runAction("set-status", { licenseId: id, status: "suspended" });
      }
    } else if (action === "activate") {
      if (await showSiteConfirm("Ativar licença", "Deseja ativar esta licença?", "Ativar", "info")) {
        await runAction("set-status", { licenseId: id, status: "active" });
      }
    } else if (action === "renew") {
      if (await showSiteConfirm("Renovar licença", "Deseja renovar esta licença por +1 ano?", "Renovar", "info")) {
        await runAction("renew-one-year", { licenseId: id });
      }
    } else if (action === "revoke") {
      if (await showSiteConfirm("Revogar máquina", "Deseja revogar o acesso desta máquina?", "Revogar", "warning")) {
        await runAction("revoke-activation", { activationId: id });
      }
    } else if (action === "delete") {
      if (await showSiteConfirm("Excluir licença", "Deseja excluir esta licença? Esta ação não pode ser desfeita.", "Excluir", "error")) {
        await runAction("delete-license", { licenseId: id });
      }
    }
  } catch (error) {
    showToast(error.message, "error");
  }
});

// ===== REFRESH =====
document.querySelector("#refreshButton")?.addEventListener("click", refreshAll);

// ===== CUSTOMER FORM =====
customerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(customerForm).entries());
  const method = payload.id ? "PUT" : "POST";
  if (!payload.id) delete payload.id;

  try {
    await api("/api/admin/customers", {
      method,
      body: JSON.stringify(payload)
    });
    customerForm.reset();
    showToast("Cliente salvo com sucesso!", "success");
    await loadCustomers();
  } catch (error) {
    showToast(error.message, "error");
  }
});

document.querySelector("#clearCustomerForm")?.addEventListener("click", () => {
  customerForm.reset();
  customerForm.elements.id.value = "";
});

// ===== CUSTOMER ACTIONS =====
customerList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-customer-action]");
  if (!button) return;
  const customer = customers.find((item) => item.id === button.dataset.id);
  if (!customer) return;

  if (button.dataset.customerAction === "edit") {
    for (const [key, value] of Object.entries(customer)) {
      if (customerForm.elements[key]) customerForm.elements[key].value = value || "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (button.dataset.customerAction === "license") {
    document.querySelector('[data-view="create"]').click();
    licenseCustomerSelect.value = customer.id;
    licenseForm.elements.customerName.value = "";
    licenseForm.elements.customerEmail.value = "";
  }
});

// ===== LOGOUT =====
document.querySelector("#logoutButton")?.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  token = "";
  setLoggedIn(false);
  showToast('Logout realizado', 'info');
});

// ===== NAVIGATION =====
document.querySelectorAll(".admin-nav[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const view = button.dataset.view;
    if (createPanel) createPanel.hidden = view !== "create";
    if (licensesPanel) licensesPanel.hidden = view !== "licenses";
    if (customersPanel) customersPanel.hidden = view !== "customers";
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// ===== INICIALIZAR =====
setLoggedIn(Boolean(token));