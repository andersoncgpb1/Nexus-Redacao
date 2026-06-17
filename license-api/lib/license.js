const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

function requiredSecret(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} precisa estar configurado.`);
  return value;
}

function hmac(value, secretName) {
  return crypto
    .createHmac("sha256", requiredSecret(secretName))
    .update(String(value || "").trim())
    .digest("hex");
}

function normalizeLicenseKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function hashLicenseKey(licenseKey) {
  return hmac(normalizeLicenseKey(licenseKey), "LICENSE_HASH_SECRET");
}

function generateLicenseKey(prefix = "NEXUS") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const groups = [];

  for (let groupIndex = 0; groupIndex < 4; groupIndex += 1) {
    let group = "";
    const bytes = crypto.randomBytes(5);
    for (let index = 0; index < 5; index += 1) {
      group += alphabet[bytes[index] % alphabet.length];
    }
    groups.push(group);
  }

  return `${prefix}-${groups.join("-")}`;
}

function hashMachineId(machineId) {
  return hmac(machineId, "MACHINE_HASH_SECRET");
}

function isExpired(expiresAt) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());
}

function signLicenseToken({ license, activation, machineHash }) {
  const graceDays = Number(process.env.OFFLINE_GRACE_DAYS || 7);
  return jwt.sign(
    {
      licenseId: license.id,
      activationId: activation.id,
      machineHash,
      plan: license.plan,
      customerName: license.customer_name,
      offlineGraceDays: graceDays
    },
    requiredSecret("LICENSE_TOKEN_SECRET"),
    {
      issuer: "nexus-redacao-license-api",
      audience: "nexus-redacao-desktop",
      expiresIn: `${graceDays}d`
    }
  );
}

function verifyLicenseToken(token) {
  return jwt.verify(token, requiredSecret("LICENSE_TOKEN_SECRET"), {
    issuer: "nexus-redacao-license-api",
    audience: "nexus-redacao-desktop"
  });
}

module.exports = {
  generateLicenseKey,
  hashLicenseKey,
  hashMachineId,
  isExpired,
  normalizeLicenseKey,
  signLicenseToken,
  verifyLicenseToken
};
