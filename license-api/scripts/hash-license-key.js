const crypto = require("node:crypto");

const licenseKey = process.argv[2];
const secret = process.env.LICENSE_HASH_SECRET;

if (!licenseKey || !secret) {
  console.error("Uso: LICENSE_HASH_SECRET=seu_segredo node scripts/hash-license-key.js CHAVE-DA-LICENCA");
  process.exit(1);
}

const normalized = licenseKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const hash = crypto.createHmac("sha256", secret).update(normalized).digest("hex");

console.log(hash);
