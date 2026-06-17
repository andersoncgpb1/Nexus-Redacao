const { getSupabase } = require("../lib/supabase");
const { sendJson, readJson, handleOptions } = require("../lib/http");
const { hashLicenseKey, hashMachineId, isExpired, signLicenseToken } = require("../lib/license");

module.exports = async function activate(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });

  try {
    const body = await readJson(req);
    const licenseKey = String(body.licenseKey || "");
    const machineId = String(body.machineId || "");

    if (!licenseKey || !machineId) {
      return sendJson(res, 400, { ok: false, error: "Informe licenseKey e machineId." });
    }

    const supabase = getSupabase();
    const licenseKeyHash = hashLicenseKey(licenseKey);
    const machineHash = hashMachineId(machineId);

    const { data: license, error: licenseError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key_hash", licenseKeyHash)
      .single();

    if (licenseError || !license) {
      return sendJson(res, 401, { ok: false, error: "Licenca invalida." });
    }

    if (license.status !== "active") {
      return sendJson(res, 403, { ok: false, error: "Licenca bloqueada ou inativa." });
    }

    if (isExpired(license.expires_at)) {
      return sendJson(res, 403, { ok: false, error: "Licenca expirada." });
    }

    const { data: existingActivation } = await supabase
      .from("license_activations")
      .select("*")
      .eq("license_id", license.id)
      .eq("machine_id_hash", machineHash)
      .is("revoked_at", null)
      .maybeSingle();

    let activation = existingActivation;

    if (!activation) {
      const { count, error: countError } = await supabase
        .from("license_activations")
        .select("*", { count: "exact", head: true })
        .eq("license_id", license.id)
        .is("revoked_at", null);

      if (countError) throw countError;

      if (count >= license.max_activations) {
        return sendJson(res, 403, { ok: false, error: "Limite de ativacoes atingido." });
      }

      const { data: created, error: createError } = await supabase
        .from("license_activations")
        .insert({
          license_id: license.id,
          machine_id_hash: machineHash,
          machine_label: String(body.machineLabel || ""),
          app_version: String(body.appVersion || "")
        })
        .select("*")
        .single();

      if (createError) throw createError;
      activation = created;
    } else {
      const { data: updated, error: updateError } = await supabase
        .from("license_activations")
        .update({
          last_seen_at: new Date().toISOString(),
          machine_label: String(body.machineLabel || existingActivation.machine_label || ""),
          app_version: String(body.appVersion || existingActivation.app_version || "")
        })
        .eq("id", existingActivation.id)
        .select("*")
        .single();

      if (updateError) throw updateError;
      activation = updated;
    }

    return sendJson(res, 200, {
      ok: true,
      license: {
        customerName: license.customer_name,
        plan: license.plan,
        expiresAt: license.expires_at,
        maxActivations: license.max_activations
      },
      activationId: activation.id,
      licenseToken: signLicenseToken({ license, activation, machineHash }),
      offlineGraceDays: Number(process.env.OFFLINE_GRACE_DAYS || 7)
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: "Erro ao ativar licenca." });
  }
};
