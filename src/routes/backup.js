const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");
const { backupService } = require("../services/backupService");

const router = express.Router();
router.use(authenticate);

router.get("/", authorize("admin", "editor"), async (req, res) => {
  res.json({ backups: await backupService.listBackups() });
});

router.post("/", authorize("admin", "editor"), async (req, res) => {
  res.json(await backupService.createBackup());
});

router.post("/restore", authorize("admin"), async (req, res) => {
  res.json(await backupService.restoreBackup(req.body.filename));
});

module.exports = router;
