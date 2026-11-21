import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import issuesRoutes from "./routes/issuesRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

/**
 * Attaches enterprise security, compression, and parser middleware to Express app.
 * @param {import("express").Express} app
 */
function configureMiddleware(app) {
  app.use((req, res, next) => {
    res.setHeader("X-Request-Id", crypto.randomUUID());
    next();
  });

  app.use(compression());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"]
        }
      }
    })
  );
  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  const clientPath = path.resolve(process.cwd(), "client");
  app.use(express.static(clientPath, { maxAge: "1d", etag: true }));
}

/**
 * Fallback handler for unmapped routes.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export function handleNotFound(req, res) {
  return res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
}

/**
 * Global unhandled error boundary middleware.
 * @param {Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function handleErrors(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  process.stderr.write(`[App Error] ${err.stack || err.message}\n`);
  return res.status(500).json({ error: "Internal server error" });
}

/**
 * Factory creating configured Express instance.
 * @returns {import("express").Express}
 */
export function createApp() {
  const app = express();

  configureMiddleware(app);

  app.use("/api/health", healthRoutes);
  app.use("/api/issues", issuesRoutes);

  app.use(handleNotFound);
  app.use(handleErrors);

  return app;
}
