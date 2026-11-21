import express, { Router } from "express";
import * as issuesController from "../controllers/issuesController.js";
import { validateCreateIssue, validateUpdateIssueStatus } from "../middleware/validateRequest.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

/**
 * Express router managing citizen grievance endpoints.
 * Mounts list, get-by-id, create-with-triage, and status-update handlers.
 */
const router = Router();
const imageBodyLimit = express.json({ limit: "1mb" });

router.get("/", issuesController.listIssues);
router.get("/:id", issuesController.getIssueById);
router.post("/", rateLimiter, imageBodyLimit, validateCreateIssue, issuesController.createIssue);
router.patch("/:id/status", rateLimiter, validateUpdateIssueStatus, issuesController.updateIssue);

export default router;
