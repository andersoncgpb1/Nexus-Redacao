const { logger } = require("../utils/logger");

function notFound(req, res) {
  res.status(404).json({ error: "Rota nao encontrada" });
}

function errorHandler(error, req, res, next) {
  logger.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({
    error: error.message || "Erro interno do servidor"
  });
}

module.exports = { notFound, errorHandler };
