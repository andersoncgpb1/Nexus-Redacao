const { getSupabase } = require("../../lib/supabase");
const { requireAdmin } = require("../../lib/admin");
const { sendJson, readJson, handleOptions } = require("../../lib/http");

module.exports = async function licenseAction(req, res) {
  if (handleOptions(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });

  try {
    const body = await readJson(req);
    const action = String(body.action || "");
    const supabase = getSupabase();

    if (action === "set-status") {
      const status = String(body.status || "");
      if (!["active", "suspended", "expired"].includes(status)) {
        return sendJson(res, 400, { ok: false, error: "Status invalido." });
      }

      const { error } = await supabase
        .from("licenses")
        .update({ status })
        .eq("id", body.licenseId);

      if (error) throw error;
      return sendJson(res, 200, { ok: true });
    }

    if (action === "revoke-activation") {
      const { error } = await supabase
        .from("license_activations")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", body.activationId);

      if (error) throw error;
      return sendJson(res, 200, { ok: true });
    }

    if (action === "delete-license") {
      const { error } = await supabase
        .from("licenses")
        .delete()
        .eq("id", body.licenseId);

      if (error) throw error;
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 400, { ok: false, error: "Acao invalida." });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: "Erro ao executar acao." });
  }
};
