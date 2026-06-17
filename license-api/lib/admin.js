const { sendJson } = require("./http");

function requireAdmin(req, res) {
  const expected = process.env.ADMIN_TOKEN;
  const authorization = String(req.headers.authorization || "");
  const received = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!expected) {
    sendJson(res, 500, { ok: false, error: "ADMIN_TOKEN nao configurado na Vercel." });
    return false;
  }

  if (!received || received !== expected) {
    sendJson(res, 401, { ok: false, error: "Acesso administrativo negado." });
    return false;
  }

  return true;
}

module.exports = { requireAdmin };
