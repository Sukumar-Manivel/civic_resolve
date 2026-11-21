import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";

/**
 * Express router managing system health check and readiness endpoints.
 */
const router = Router();

router.get("/", getHealth);

export default router;
