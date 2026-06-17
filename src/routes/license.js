const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const express = require("express");

const router = express.Router();

function licenseApiUrl() {
  return String(process.env.LICENSE_API_URL || "").replace(/\/+$/, "");
}

function licenseStorePath() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "nexus.db");
  return path.join(path.dirname(dbPath), "license.json");
}

async function readLicenseStore() {
  try {
    return JSON.parse(await fs.readFile(licenseStorePath(), "utf8"));
  } catch {
    return {};
  }
}

async function writeLicenseStore(data) {
  const file = licenseStorePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function getMachineId() {
  const store = await readLicenseStore();
  if (store.machineId) return store.machineId;
  const machineId = crypto.randomUUID();
  await writeLicenseStore({ ...store, machineId });
  return machineId;
}

function machineLabel() {
  return `${os.hostname()} - ${os.userInfo().username}`;
}

async function callLicenseApi(endpoint, payload) {
  const baseUrl = licenseApiUrl();
  if (!baseUrl) throw new Error("LICENSE_API_URL nao configurado.");

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || "Erro ao validar licenca.");
    error.status = response.status;
    throw error;
  }
  return data;
}

router.get("/status", async (req, res) => {
  try {
    const apiUrl = licenseApiUrl();
    if (!apiUrl) {
      return res.json({ configured: false, activated: true, mode: "local" });
    }

    const store = await readLicenseStore();
    if (!store.licenseToken) {
      return res.json({ configured: true, activated: false });
    }

    const machineId = await getMachineId();
    const data = await callLicenseApi("/api/verify", {
      licenseToken: store.licenseToken,
      machineId,
      appVersion: require("../../package.json").version
    });

    return res.json({
      configured: true,
      activated: true,
      license: data.license
    });
  } catch (error) {
    if ([401, 403].includes(error.status) || /bloqueada|inativa|expirada|invalido|inválido/i.test(error.message)) {
      const store = await readLicenseStore();
      await writeLicenseStore({ machineId: store.machineId, lastError: error.message });
      return res.json({
        configured: true,
        activated: false,
        blocked: true,
        error: error.message
      });
    }

    const store = await readLicenseStore();
    const lastActivationAt = store.activatedAt ? new Date(store.activatedAt).getTime() : 0;
    const graceDays = Number(store.offlineGraceDays || process.env.OFFLINE_GRACE_DAYS || 7);
    const withinGrace = lastActivationAt && Date.now() - lastActivationAt < graceDays * 24 * 60 * 60 * 1000;
    return res.json({
      configured: true,
      activated: Boolean(store.licenseToken && withinGrace),
      offline: true,
      error: error.message
    });
  }
});

router.post("/activate", async (req, res) => {
  try {
    const machineId = await getMachineId();
    const data = await callLicenseApi("/api/activate", {
      licenseKey: req.body.licenseKey,
      machineId,
      machineLabel: machineLabel(),
      appVersion: require("../../package.json").version
    });

    await writeLicenseStore({
      ...(await readLicenseStore()),
      licenseToken: data.licenseToken,
      license: data.license,
      offlineGraceDays: data.offlineGraceDays,
      activatedAt: new Date().toISOString()
    });

    return res.json({
      ok: true,
      activated: true,
      license: data.license
    });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/clear", async (req, res) => {
  const store = await readLicenseStore();
  await writeLicenseStore({ machineId: store.machineId });
  res.json({ ok: true });
});

module.exports = router;
