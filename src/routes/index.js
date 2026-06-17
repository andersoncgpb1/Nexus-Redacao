const authRoutes = require("./auth");
const stateRoutes = require("./state");
const backupRoutes = require("./backup");
const userRoutes = require("./users");
const licenseRoutes = require("./license");

function setupRoutes(app) {
  app.use("/api", authRoutes);
  app.use("/api/state", stateRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/license", licenseRoutes);
  app.get("/api/health", (req, res) => res.json({ ok: true, app: "Nexus Redacao Robust" }));
}

module.exports = { setupRoutes };
