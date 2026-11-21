import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import issuesRoutes from "./routes/issuesRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

function configureMiddleware(app) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"]
        }
      }
    })
  );
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  const clientPath = path.resolve(process.cwd(), "client");
  app.use(express.static(clientPath));
}

export function handleNotFound(req, res) {
  return res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
}

export function handleErrors(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  process.stderr.write(`[App Error] ${err.stack || err.message}\n`);
  return res.status(500).json({ error: "Internal server error" });
}

export function createApp() {
  const app = express();

  configureMiddleware(app);

  app.use("/api/health", healthRoutes);
  app.use("/api/issues", issuesRoutes);

  app.use(handleNotFound);
  app.use(handleErrors);

  return app;
}
