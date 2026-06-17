const { sendJson } = require("./http");
const jwt = require("jsonwebtoken");

function requiredAdminSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET nao configurado na Vercel.");
  return secret;
}

function signAdminSession(username) {
  return jwt.sign(
    { username, scope: "admin" },
    requiredAdminSecret(),
    {
      issuer: "nexus-redacao-license-api",
      audience: "nexus-redacao-admin",
      expiresIn: "12h"
    }
  );
}

function requireAdmin(req, res) {
  const authorization = String(req.headers.authorization || "");
  const received = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!received) {
    sendJson(res, 401, { ok: false, error: "Sessao administrativa nao informada." });
    return false;
  }

  if (process.env.ADMIN_TOKEN && received === process.env.ADMIN_TOKEN) {
    return true;
  }

  try {
    const payload = jwt.verify(received, requiredAdminSecret(), {
      issuer: "nexus-redacao-license-api",
      audience: "nexus-redacao-admin"
    });
    if (payload.scope === "admin") return true;
  } catch {
    // A resposta abaixo cobre token ausente, expirado ou invalido.
  }

  {
    sendJson(res, 401, { ok: false, error: "Acesso administrativo negado." });
    return false;
  }
}

function checkAdminCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    throw new Error("ADMIN_PASSWORD nao configurado na Vercel.");
  }

  return username === expectedUser && password === expectedPassword;
}

module.exports = { checkAdminCredentials, requireAdmin, signAdminSession };
