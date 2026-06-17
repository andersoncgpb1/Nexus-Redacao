const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../database/database");
const { authenticate, generateToken } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const password = String(req.body.password || "");
  const user = await getDb().get("SELECT * FROM users WHERE email = ? AND active = 1", [email]);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, error: "Credenciais invalidas" });
  }

  await getDb().run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
  const token = generateToken(user.id);
  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

router.get("/setup-status", async (req, res) => {
  const count = await getDb().get("SELECT COUNT(*) as total FROM users");
  res.json({ needsSetup: count.total === 0 });
});

router.post("/setup-admin", async (req, res) => {
  const count = await getDb().get("SELECT COUNT(*) as total FROM users");
  if (count.total > 0) return res.status(409).json({ success: false, error: "Administrador inicial ja foi criado" });

  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");

  if (!email || !name || password.length < 6) {
    return res.status(400).json({ success: false, error: "Informe nome, e-mail e senha com pelo menos 6 caracteres" });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await getDb().run(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
    [email, hash, name, "admin"]
  );

  await getDb().run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [result.lastID]);
  const token = generateToken(result.lastID);
  res.status(201).json({
    success: true,
    token,
    user: { id: result.lastID, email, name, role: "admin" }
  });
});

router.post("/verify", authenticate, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
