require("dotenv").config();
const fs = require("node:fs/promises");
const path = require("node:path");
const { existsSync } = require("node:fs");
const { getDb, initDatabase } = require("../database/database");
const { logger } = require("../utils/logger");

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || "./backups";
  }

  async createBackup() {
    await fs.mkdir(this.backupDir, { recursive: true });
    const db = getDb();
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        users: await db.all("SELECT id, email, name, role, active, created_at, updated_at FROM users"),
        app_state: await db.all("SELECT * FROM app_state"),
        audit_log: await db.all("SELECT * FROM audit_log ORDER BY id DESC LIMIT 500")
      }
    };
    const filename = `backup-${Date.now()}.json`;
    await fs.writeFile(path.join(this.backupDir, filename), JSON.stringify(backup, null, 2), "utf8");
    logger.info(`Backup criado: ${filename}`);
    return { ok: true, filename };
  }

  async restoreBackup(filename) {
    const filePath = path.normalize(path.join(this.backupDir, filename || ""));
    if (!filePath.startsWith(path.resolve(this.backupDir))) return { ok: false, error: "Backup invalido" };
    if (!existsSync(filePath)) return { ok: false, error: "Backup nao encontrado" };

    const backup = JSON.parse(await fs.readFile(filePath, "utf8"));
    const db = getDb();
    await db.exec("BEGIN TRANSACTION");
    try {
      await db.run("DELETE FROM app_state");
      for (const row of backup.data.app_state || []) {
        await db.run("INSERT INTO app_state (id, state_json, updated_at) VALUES (?, ?, ?)", [row.id, row.state_json, row.updated_at]);
      }
      await db.exec("COMMIT");
      return { ok: true };
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  }

  async listBackups() {
    if (!existsSync(this.backupDir)) return [];
    const files = await fs.readdir(this.backupDir);
    const backups = [];
    for (const file of files.filter((name) => name.endsWith(".json"))) {
      const stat = await fs.stat(path.join(this.backupDir, file));
      backups.push({ filename: file, size: stat.size, created: stat.mtime });
    }
    return backups.sort((a, b) => b.created - a.created);
  }
}

const backupService = new BackupService();

if (require.main === module) {
  initDatabase()
    .then(() => backupService.createBackup())
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { backupService };
