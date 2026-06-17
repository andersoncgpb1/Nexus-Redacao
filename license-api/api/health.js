const { sendJson } = require("../lib/http");

module.exports = async function health(req, res) {
  return sendJson(res, 200, {
    ok: true,
    app: "Nexus Redacao License API",
    version: "1.0.0"
  });
};
