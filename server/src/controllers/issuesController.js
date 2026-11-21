import * as issuesService from "../services/issuesService.js";

export function listIssues(req, res) {
  const { status, category, search } = req.query;
  const issues = issuesService.getIssues({ status, category, search });
  return res.status(200).json({ count: issues.length, data: issues });
}

export async function createIssue(req, res, next) {
  try {
    const issue = await issuesService.createIssue(req.body);
    return res.status(201).json(issue);
  } catch (err) {
    return next(err);
  }
}

export function updateIssue(req, res) {
  const { id } = req.params;
  const updated = issuesService.updateIssue(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: `Issue with ID '${id}' not found` });
  }
  return res.status(200).json(updated);
}
