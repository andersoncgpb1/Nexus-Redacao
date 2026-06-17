const express = require("express");
const { getDb } = require("../database/database");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const row = await getDb().get("SELECT state_json FROM app_state WHERE id = 1");
  res.json({ state: row ? JSON.parse(row.state_json) : null });
});

router.put("/", async (req, res) => {
  const state = req.body.state || req.body;
  await getDb().run(
    `INSERT INTO app_state (id, state_json, updated_at)
     VALUES (1, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json, updated_at = CURRENT_TIMESTAMP`,
    [JSON.stringify(state)]
  );
  await getDb().run(
    "INSERT INTO audit_log (user_id, action, entity, details) VALUES (?, ?, ?, ?)",
    [req.user.id, "state.save", "app_state", JSON.stringify({ size: JSON.stringify(state).length })]
  );
  res.json({ ok: true, savedAt: new Date().toISOString() });
});

router.delete("/", async (req, res) => {
  await getDb().run("DELETE FROM app_state WHERE id = 1");
  await getDb().run(
    "INSERT INTO audit_log (user_id, action, entity) VALUES (?, ?, ?)",
    [req.user.id, "state.reset", "app_state"]
  );
  res.json({ ok: true });
});

module.exports = router;
