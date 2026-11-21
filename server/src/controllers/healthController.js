import * as issuesService from "../services/issuesService.js";

export function getHealth(req, res) {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "civic-resolve",
    issuesCount: issuesService.getIssues().length
  });
}
