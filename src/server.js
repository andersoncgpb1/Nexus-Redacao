require("dotenv").config();

const path = require("node:path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { initDatabase } = require("./database/database");
const { setupRoutes } = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");
const { logger, httpLogger } = require("./utils/logger");

const app = express();
const ROOT = path.resolve(__dirname, "..");

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || true,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(httpLogger);
app.use("/api", rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false
}));

setupRoutes(app);

app.use(express.static(ROOT, { etag: false, maxAge: 0 }));
app.get("*", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.use(errorHandler);

async function start(options = {}) {
  await initDatabase();
  const { seedIfEmpty } = require("./seedUsers");
  await seedIfEmpty();

  const port = Number(options.port ?? (process.env.PORT || 3000));
  return listen(port);
}

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      logger.info(`Nexus Redacao Robust em http://localhost:${actualPort}`);
      logger.info(`Usuario administrador inicial: ${process.env.ADMIN_EMAIL || "admin@nexus.com"}`);
      resolve(server);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE" && port !== 0) {
        logger.warn(`Porta ${port} em uso. Tentando ${port + 1}`);
        listen(port + 1).then(resolve).catch(reject);
        return;
      }
      reject(error);
    });
  });
}

if (require.main === module) {
  start().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}

module.exports = { app, start };
