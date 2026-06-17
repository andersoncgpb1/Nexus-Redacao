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

router.post("/verify", authenticate, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
