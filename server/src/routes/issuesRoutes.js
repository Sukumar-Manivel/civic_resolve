import { Router } from "express";
import * as issuesController from "../controllers/issuesController.js";
import { validateCreateIssue, validateUpdateIssueStatus } from "../middleware/validateRequest.js";

const router = Router();

router.get("/", issuesController.listIssues);
router.post("/", validateCreateIssue, issuesController.createIssue);
router.patch("/:id/status", validateUpdateIssueStatus, issuesController.updateIssue);

export default router;
