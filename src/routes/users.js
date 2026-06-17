const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../database/database");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/", async (req, res) => {
  const users = await getDb().all("SELECT id, email, name, role, active, last_login, created_at, updated_at FROM users ORDER BY name");
  res.json({ success: true, users });
});

router.post("/", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "reporter");
  if (!email || !name || !password) return res.status(400).json({ success: false, error: "Nome, e-mail e senha sao obrigatorios" });
  if (!["admin", "editor", "reporter", "writer"].includes(role)) return res.status(400).json({ success: false, error: "Perfil invalido" });
  const existing = await getDb().get("SELECT * FROM users WHERE email = ? AND active = 1", [email]);
  if (existing) return res.status(409).json({ success: false, error: "E-mail ja cadastrado" });
  const hash = await bcrypt.hash(password, 10);
  const result = await getDb().run(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
    [email, hash, name, role]
  );
  res.status(201).json({ success: true, id: result.lastID });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const email = String(req.body.email || "").trim().toLowerCase();
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "reporter");
  const active = req.body.active === false || req.body.active === "0" ? 0 : 1;
  if (!email || !name) return res.status(400).json({ success: false, error: "Nome e e-mail sao obrigatorios" });
  if (!["admin", "editor", "reporter", "writer"].includes(role)) return res.status(400).json({ success: false, error: "Perfil invalido" });
  const result = password
    ? await getDb().run(
      "UPDATE users SET name = ?, email = ?, role = ?, active = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, email, role, active, await bcrypt.hash(password, 10), id]
    )
    : await getDb().run(
      "UPDATE users SET name = ?, email = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, email, role, active, id]
    );
  if (!result.changes) return res.status(404).json({ success: false, error: "Usuario nao encontrado" });
  res.json({ success: true });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ success: false, error: "Voce nao pode desativar seu proprio usuario" });
  const result = await getDb().run("UPDATE users SET active = 0 WHERE id = ?", [id]);
  if (!result.changes) return res.status(404).json({ success: false, error: "Usuario nao encontrado" });
  res.json({ success: true });
});

module.exports = router;
