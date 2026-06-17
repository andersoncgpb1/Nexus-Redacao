const { getSupabase } = require("../../lib/supabase");
const { requireAdmin } = require("../../lib/admin");
const { sendJson, readJson, handleOptions } = require("../../lib/http");
const { generateLicenseKey, hashLicenseKey } = require("../../lib/license");

module.exports = async function licenses(req, res) {
  if (handleOptions(req, res)) return;
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") return await listLicenses(req, res);
    if (req.method === "POST") return await createLicense(req, res);
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: "Erro no painel administrativo." });
  }
};

async function listLicenses(req, res) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("licenses")
    .select("*, license_activations(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return sendJson(res, 200, {
    ok: true,
    licenses: (data || []).map((license) => ({
      id: license.id,
      customerName: license.customer_name,
      customerEmail: license.customer_email,
      plan: license.plan,
      status: license.status,
      expiresAt: license.expires_at,
      maxActivations: license.max_activations,
      notes: license.notes,
      createdAt: license.created_at,
      activations: (license.license_activations || []).map((activation) => ({
        id: activation.id,
        machineLabel: activation.machine_label,
        appVersion: activation.app_version,
        activatedAt: activation.activated_at,
        lastSeenAt: activation.last_seen_at,
        revokedAt: activation.revoked_at
      }))
    }))
  });
}

async function createLicense(req, res) {
  const body = await readJson(req);
  const licenseKey = String(body.licenseKey || generateLicenseKey()).trim().toUpperCase();
  const maxActivations = Math.max(1, Number(body.maxActivations || 1));

  if (!body.customerName) {
    return sendJson(res, 400, { ok: false, error: "Informe o nome do cliente." });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("licenses")
    .insert({
      license_key_hash: hashLicenseKey(licenseKey),
      customer_name: String(body.customerName || "").trim(),
      customer_email: String(body.customerEmail || "").trim() || null,
      plan: String(body.plan || "standard").trim(),
      status: "active",
      expires_at: body.expiresAt || null,
      max_activations: maxActivations,
      notes: String(body.notes || "").trim() || null
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return sendJson(res, 409, { ok: false, error: "Essa chave ja existe." });
    }
    throw error;
  }

  return sendJson(res, 201, {
    ok: true,
    licenseKey,
    license: {
      id: data.id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      plan: data.plan,
      status: data.status,
      expiresAt: data.expires_at,
      maxActivations: data.max_activations
    }
  });
}
