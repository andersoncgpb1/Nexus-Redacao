const { sendJson } = require("../lib/http");

module.exports = async function health(req, res) {
  return sendJson(res, 200, {
    ok: true,
    app: "Nexus Redacao License API",
    version: "1.0.0",
    env: {
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      licenseHashSecret: Boolean(process.env.LICENSE_HASH_SECRET),
      machineHashSecret: Boolean(process.env.MACHINE_HASH_SECRET),
      licenseTokenSecret: Boolean(process.env.LICENSE_TOKEN_SECRET),
      adminToken: Boolean(process.env.ADMIN_TOKEN),
      offlineGraceDays: Boolean(process.env.OFFLINE_GRACE_DAYS)
    }
  });
};
