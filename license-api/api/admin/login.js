const { checkAdminCredentials, signAdminSession } = require("../../lib/admin");
const { sendJson, readJson, handleOptions } = require("../../lib/http");

module.exports = async function adminLogin(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });

  try {
    const body = await readJson(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!checkAdminCredentials(username, password)) {
      return sendJson(res, 401, { ok: false, error: "Usuario ou senha invalidos." });
    }

    return sendJson(res, 200, {
      ok: true,
      token: signAdminSession(username),
      user: { username }
    });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: error.message || "Erro ao entrar no painel." });
  }
};
