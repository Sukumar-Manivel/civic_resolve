import * as issuesService from "../services/issuesService.js";

/**
 * Controller to list issues matching optional filters and pagination.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export function listIssues(req, res) {
  const { status, category, search, limit, offset } = req.query;
  const issues = issuesService.getIssues({ status, category, search, limit, offset });
  return res.status(200).json({ count: issues.length, data: issues });
}

/**
 * Controller to retrieve a single issue by unique ID with full payload.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export function getIssueById(req, res) {
  const { id } = req.params;
  const issue = issuesService.getIssueById(id);
  if (!issue) {
    return res.status(404).json({ error: `Issue with ID '${id}' not found` });
  }
  return res.status(200).json(issue);
}

/**
 * Controller to submit a new citizen grievance with AI triage.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export async function createIssue(req, res, next) {
  try {
    const issue = await issuesService.createIssue(req.body);
    return res.status(201).json(issue);
  } catch (err) {
    return next(err);
  }
}

/**
 * Controller to update municipal status, priority, or resolution notes.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export function updateIssue(req, res) {
  const { id } = req.params;
  const updated = issuesService.updateIssue(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: `Issue with ID '${id}' not found` });
  }
  return res.status(200).json(updated);
}
