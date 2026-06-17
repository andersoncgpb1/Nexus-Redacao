require("dotenv").config();
const bcrypt = require("bcryptjs");
const { initDatabase, getDb } = require("./database");

async function seed() {
  await initDatabase();
  const db = getDb();

  const users = [
    ["admin@nexus.com", "admin123", "Administrador", "admin"],
    ["editor@nexus.com", "editor123", "Editor Chefe", "editor"],
    ["reporter@nexus.com", "reporter123", "Reporter", "reporter"],
    ["pauteiro@nexus.com", "pauteiro123", "Pauteiro", "writer"]
  ];

  for (const [email, password, name, role] of users) {
    const hash = await bcrypt.hash(password, 10);
    await db.run(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name, role = excluded.role, active = 1`,
      [email, hash, name, role]
    );
  }

  console.log("Seed concluido");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
