const jwt = require("jsonwebtoken");
const { getDb } = require("../database/database");

const JWT_SECRET = process.env.JWT_SECRET || "nexus-secret";

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Token nao fornecido" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getDb().get(
      "SELECT id, email, name, role, active FROM users WHERE id = ? AND active = 1",
      [decoded.userId]
    );
    if (!user) return res.status(401).json({ error: "Usuario nao encontrado" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Nao autenticado" });
    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: "Acesso negado" });
    next();
  };
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

module.exports = { authenticate, authorize, generateToken };
