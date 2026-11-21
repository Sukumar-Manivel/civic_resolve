import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";

export function handleHealth(req, res) {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "h2s-100-starter"
  });
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const clientPath = path.resolve(process.cwd(), "client");
  app.use(express.static(clientPath));

  app.get("/api/health", handleHealth);

  return app;
}
