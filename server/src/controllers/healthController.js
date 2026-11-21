import * as issuesService from "../services/issuesService.js";

/**
 * Health check endpoint returning service status and issue count.
 * @param {import("express").Request} req - Express request
 * @param {import("express").Response} res - Express response
 * @returns {import("express").Response} Health status JSON
 */
export function getHealth(req, res) {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "civic-resolve",
    issuesCount: issuesService.getIssues().length
  });
}
