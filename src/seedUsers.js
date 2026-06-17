const bcrypt = require("bcryptjs");
const { getDb } = require("./database/database");

async function seedIfEmpty() {
  const db = getDb();
  const count = await db.get("SELECT COUNT(*) as total FROM users");
  if (count.total > 0) return;

  const users = [
    [
      process.env.ADMIN_EMAIL || "admin@nexus.com",
      process.env.ADMIN_PASSWORD || "admin123",
      process.env.ADMIN_NAME || "Administrador",
      "admin"
    ]
  ];

  for (const [email, password, name, role] of users) {
    await db.run(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
      [email, await bcrypt.hash(password, 10), name, role]
    );
  }
}

module.exports = { seedIfEmpty };
