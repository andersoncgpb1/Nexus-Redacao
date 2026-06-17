const path = require("node:path");
const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { logger } = require("../utils/logger");

let store = null;
let storePath = null;

function resolveStorePath() {
  const configured = process.env.DB_PATH || "./data/nexus-store.json";
  return configured.toLowerCase().endsWith(".db")
    ? configured.replace(/\.db$/i, ".json")
    : configured;
}

async function initDatabase() {
  storePath = resolveStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  store = { users: [], app_state: null, audit_log: [] };

  if (existsSync(storePath)) {
    try {
      store = JSON.parse(await fs.readFile(storePath, "utf8"));
      store.users ||= [];
      store.app_state ||= null;
      store.audit_log ||= [];
    } catch {
      logger.warn("Banco JSON invalido; iniciando novo armazenamento local.");
    }
  }

  await persist();
  logger.info("Banco JSON inicializado");
  return getDb();
}

async function persist() {
  if (!storePath || !store) return;
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

function getDb() {
  if (!store) throw new Error("Banco de dados nao inicializado");
  return {
    async get(sql, params = []) {
      if (/COUNT\(\*\).*FROM users/i.test(sql)) return { total: store.users.length };
      if (/FROM users WHERE email/i.test(sql)) {
        const email = String(params[0] || "").toLowerCase();
        return store.users.find(user => user.email === email && user.active !== 0) || null;
      }
      if (/FROM users WHERE id/i.test(sql)) {
        const id = Number(params[0]);
        return publicUser(store.users.find(user => user.id === id && user.active !== 0)) || null;
      }
      if (/SELECT state_json FROM app_state/i.test(sql)) return store.app_state;
      return null;
    },
    async all(sql) {
      if (/FROM users/i.test(sql)) return store.users.map(publicUser);
      if (/FROM app_state/i.test(sql)) return store.app_state ? [store.app_state] : [];
      if (/FROM audit_log/i.test(sql)) return [...store.audit_log].slice(-500).reverse();
      return [];
    },
    async run(sql, params = []) {
      if (/INSERT INTO users/i.test(sql)) {
        const id = store.users.reduce((max, user) => Math.max(max, user.id || 0), 0) + 1;
        store.users.push({
          id,
          email: String(params[0] || "").toLowerCase(),
          password_hash: params[1],
          name: params[2],
          role: params[3],
          active: 1,
          created_at: now(),
          updated_at: now()
        });
        await persist();
        return { lastID: id, changes: 1 };
      }
      if (/UPDATE users SET last_login/i.test(sql)) {
        const user = store.users.find(item => item.id === Number(params[0]));
        if (user) user.last_login = now();
        await persist();
        return { changes: user ? 1 : 0 };
      }
      if (/UPDATE users SET name/i.test(sql)) {
        const hasPassword = /password_hash/i.test(sql);
        const id = Number(params[hasPassword ? 5 : 4]);
        const user = store.users.find(item => item.id === id);
        if (!user) return { changes: 0 };
        user.name = params[0];
        user.email = String(params[1] || "").toLowerCase();
        user.role = params[2];
        user.active = Number(params[3]);
        if (hasPassword) user.password_hash = params[4];
        user.updated_at = now();
        await persist();
        return { changes: 1 };
      }
      if (/DELETE FROM users/i.test(sql) || /UPDATE users SET active = 0/i.test(sql)) {
        const user = store.users.find(item => item.id === Number(params[0]));
        if (!user) return { changes: 0 };
        user.active = 0;
        user.updated_at = now();
        await persist();
        return { changes: 1 };
      }
      if (/INSERT INTO app_state/i.test(sql)) {
        store.app_state = { id: Number(params[0]) || 1, state_json: params[1] || params[0], updated_at: params[2] || now() };
        if (typeof store.app_state.state_json !== "string") store.app_state.state_json = String(store.app_state.state_json || "{}");
        await persist();
        return { changes: 1 };
      }
      if (/DELETE FROM app_state/i.test(sql)) {
        store.app_state = null;
        await persist();
        return { changes: 1 };
      }
      if (/INSERT INTO audit_log/i.test(sql)) {
        const id = store.audit_log.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
        store.audit_log.push({
          id,
          user_id: params[0],
          action: params[1],
          entity: params[2],
          details: params[3] || "",
          created_at: now()
        });
        await persist();
        return { lastID: id, changes: 1 };
      }
      return { changes: 0 };
    },
    async exec() {
      return undefined;
    }
  };
}

module.exports = { initDatabase, getDb };
