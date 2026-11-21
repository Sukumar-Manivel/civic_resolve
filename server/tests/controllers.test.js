import { describe, it, expect, vi, beforeEach } from "vitest";
import * as issuesController from "../src/controllers/issuesController.js";
import { getHealth } from "../src/controllers/healthController.js";
import * as issuesService from "../src/services/issuesService.js";
import { createMockRes } from "./testHelpers.js";

describe("listIssues Controller", () => {
  beforeEach(() => {
    issuesService.resetStore();
  });

  it("responds with status 200 and issue list payload", () => {
    const res = createMockRes();
    issuesController.listIssues({ query: { status: "Reported", limit: "2", offset: "0" } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeLessThanOrEqual(2);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("getIssueById Controller", () => {
  beforeEach(() => {
    issuesService.resetStore();
  });

  it("responds with status 200 when issue exists", () => {
    const res = createMockRes();
    issuesController.getIssueById({ params: { id: "civic-seed-001" } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe("civic-seed-001");
  });

  it("responds with status 404 when issue does not exist", () => {
    const res = createMockRes();
    issuesController.getIssueById({ params: { id: "non-existent-id" } }, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain("not found");
  });
});

describe("createIssue Controller", () => {
  it("responds with 201 upon successful issue creation", async () => {
    const req = {
      body: {
        title: "Leaking Fire Hydrant",
        description: "Water gushing onto main boulevard",
        location: "Boulevard Road",
        category: "Water & Sewerage"
      }
    };
    const res = createMockRes();
    await issuesController.createIssue(req, res, vi.fn());
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe("Leaking Fire Hydrant");
  });

  it("invokes next(err) if issuesService throws an error", async () => {
    const res = createMockRes();
    const next = vi.fn();
    const spy = vi.spyOn(issuesService, "createIssue").mockRejectedValue(new Error("Storage full"));
    await issuesController.createIssue({ body: {} }, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });
});

describe("updateIssue Controller", () => {
  it("responds with 200 and updated issue when ID exists", () => {
    const req = {
      params: { id: "civic-seed-001" },
      body: { status: "Resolved", resolutionNotes: "Patching completed." }
    };
    const res = createMockRes();
    issuesController.updateIssue(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Resolved");
  });

  it("responds with 404 when issue ID does not exist", () => {
    const req = { params: { id: "unknown-id-404" }, body: { status: "Resolved" } };
    const res = createMockRes();
    issuesController.updateIssue(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain("not found");
  });
});

describe("healthController", () => {
  it("returns status 200 and service metrics", () => {
    const res = createMockRes();
    getHealth({}, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("civic-resolve");
  });
});
