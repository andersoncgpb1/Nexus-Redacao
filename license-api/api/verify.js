const { getSupabase } = require("../lib/supabase");
const { sendJson, readJson, handleOptions } = require("../lib/http");
const { hashMachineId, isExpired, verifyLicenseToken } = require("../lib/license");

module.exports = async function verify(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });

  try {
    const body = await readJson(req);
    const token = String(body.licenseToken || "");
    const machineId = String(body.machineId || "");

    if (!token || !machineId) {
      return sendJson(res, 400, { ok: false, error: "Informe licenseToken e machineId." });
    }

    const payload = verifyLicenseToken(token);
    const machineHash = hashMachineId(machineId);

    if (payload.machineHash !== machineHash) {
      return sendJson(res, 403, { ok: false, error: "Licenca ativada em outro computador." });
    }

    const supabase = getSupabase();
    const { data: activation, error: activationError } = await supabase
      .from("license_activations")
      .select("*, licenses(*)")
      .eq("id", payload.activationId)
      .eq("machine_id_hash", machineHash)
      .is("revoked_at", null)
      .single();

    if (activationError || !activation || !activation.licenses) {
      return sendJson(res, 401, { ok: false, error: "Ativacao nao encontrada." });
    }

    if (activation.licenses.status !== "active") {
      return sendJson(res, 403, { ok: false, error: "Licenca bloqueada ou inativa." });
    }

    if (isExpired(activation.licenses.expires_at)) {
      return sendJson(res, 403, { ok: false, error: "Licenca expirada." });
    }

    await supabase
      .from("license_activations")
      .update({
        last_seen_at: new Date().toISOString(),
        app_version: String(body.appVersion || activation.app_version || "")
      })
      .eq("id", activation.id);

    return sendJson(res, 200, {
      ok: true,
      license: {
        customerName: activation.licenses.customer_name,
        plan: activation.licenses.plan,
        expiresAt: activation.licenses.expires_at
      }
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 401, { ok: false, error: "Token de licenca invalido ou expirado." });
  }
};
