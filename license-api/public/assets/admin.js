const TOKEN_KEY = "nexus_admin_token";

const loginView = document.querySelector("#loginView");
const adminView = document.querySelector("#adminView");
const loginForm = document.querySelector("#adminLoginForm");
const licenseForm = document.querySelector("#licenseForm");
const licenseList = document.querySelector("#licenseList");
const summaryText = document.querySelector("#summaryText");
const createPanel = document.querySelector("#createPanel");
const licensesPanel = document.querySelector("#licensesPanel");
const createdLicense = document.querySelector("#createdLicense");
const toast = document.querySelector("#toast");

let token = localStorage.getItem(TOKEN_KEY) || "";

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
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
  loginView.hidden = value;
  adminView.hidden = !value;
  if (value) loadLicenses();
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

function renderLicenses(licenses) {
  summaryText.textContent = `${licenses.length} licenca(s)`;

  if (!licenses.length) {
    licenseList.innerHTML = `<div class="license-card">Nenhuma licenca cadastrada.</div>`;
    return;
  }

  licenseList.innerHTML = licenses.map((license) => `
    <article class="license-card">
      <div class="license-card-header">
        <div class="license-title">
          <strong>${escapeHtml(license.customerName)}</strong>
          <span>${escapeHtml(license.customerEmail || "Sem e-mail")}</span>
          <span class="license-meta">
            Plano: ${escapeHtml(license.plan)} · Validade: ${formatDate(license.expiresAt)} ·
            Ativacoes: ${activeActivations(license).length}/${license.maxActivations}
          </span>
        </div>
        <div class="license-actions">
          <span class="status ${license.status}">${statusLabel(license.status)}</span>
          ${license.status === "active"
            ? `<button class="mini-button" data-action="suspend" data-id="${license.id}">Suspender</button>`
            : `<button class="mini-button" data-action="activate" data-id="${license.id}">Ativar</button>`}
          <button class="mini-button danger" data-action="delete" data-id="${license.id}">Excluir</button>
        </div>
      </div>
      <div class="activation-list">
        ${license.activations.length ? license.activations.map((activation) => `
          <div class="activation-row">
            <span>
              ${escapeHtml(activation.machineLabel || "Computador sem nome")}
              · Versao ${escapeHtml(activation.appVersion || "-")}
              · ultimo acesso ${formatDate(activation.lastSeenAt)}
              ${activation.revokedAt ? " · revogada" : ""}
            </span>
            ${activation.revokedAt
              ? ""
              : `<button class="mini-button danger" data-action="revoke" data-id="${activation.id}">Revogar maquina</button>`}
          </div>
        `).join("") : `<span>Nenhuma maquina ativada.</span>`}
      </div>
    </article>
  `).join("");
}

function activeActivations(license) {
  return license.activations.filter((activation) => !activation.revokedAt);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadLicenses() {
  summaryText.textContent = "Carregando...";
  licenseList.innerHTML = "";
  try {
    const data = await api("/api/admin/licenses");
    renderLicenses(data.licenses || []);
  } catch (error) {
    showToast(error.message);
    if (/negado|token/i.test(error.message)) {
      localStorage.removeItem(TOKEN_KEY);
      token = "";
      setLoggedIn(false);
    }
  }
}

async function runAction(action, payload = {}) {
  await api("/api/admin/license-action", {
    method: "POST",
    body: JSON.stringify({ action, ...payload })
  });
  await loadLicenses();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  token = document.querySelector("#adminToken").value.trim();
  localStorage.setItem(TOKEN_KEY, token);
  setLoggedIn(true);
});

licenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(licenseForm);
  const payload = Object.fromEntries(formData.entries());
  if (!payload.expiresAt) delete payload.expiresAt;

  try {
    const data = await api("/api/admin/licenses", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    createdLicense.hidden = false;
    createdLicense.innerHTML = `Chave gerada: <code>${escapeHtml(data.licenseKey)}</code>`;
    licenseForm.reset();
    licenseForm.elements.plan.value = "standard";
    licenseForm.elements.maxActivations.value = "1";
    showToast("Licenca criada.");
    await loadLicenses();
  } catch (error) {
    showToast(error.message);
  }
});

licenseList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  try {
    if (action === "suspend") await runAction("set-status", { licenseId: id, status: "suspended" });
    if (action === "activate") await runAction("set-status", { licenseId: id, status: "active" });
    if (action === "revoke") await runAction("revoke-activation", { activationId: id });
    if (action === "delete" && confirm("Excluir esta licenca?")) {
      await runAction("delete-license", { licenseId: id });
    }
    showToast("Acao concluida.");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector("#refreshButton").addEventListener("click", loadLicenses);

document.querySelector("#logoutButton").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  token = "";
  setLoggedIn(false);
});

document.querySelectorAll(".admin-nav[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const view = button.dataset.view;
    createPanel.hidden = view !== "create";
    licensesPanel.hidden = view !== "licenses";
  });
});

setLoggedIn(Boolean(token));
