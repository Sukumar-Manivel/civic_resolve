import { describe, it, expect, vi } from "vitest";
import {
  validateCreateIssue,
  validateUpdateIssueStatus
} from "../src/middleware/validateRequest.js";
import { createMockRes } from "./testHelpers.js";

describe("validateCreateIssue Body and Text Validations", () => {
  it("rejects non-object or null request body with 400", () => {
    const res = createMockRes();
    validateCreateIssue({ body: null }, res, vi.fn());
    expect(res.statusCode).toBe(400);

    const res2 = createMockRes();
    validateCreateIssue({ body: "invalid-string" }, res2, vi.fn());
    expect(res2.statusCode).toBe(400);
  });

  it("rejects invalid, missing, or out-of-range text fields", () => {
    const res = createMockRes();
    validateCreateIssue({
      body: { title: "ab", description: "four", location: 12345 }
    }, res, vi.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body.details.length).toBeGreaterThanOrEqual(3);
  });
});

describe("validateCreateIssue Category Validation", () => {
  it("rejects invalid category enum value", () => {
    const res = createMockRes();
    validateCreateIssue({
      body: { title: "Valid title", description: "Valid detailed description", location: "Valid location", category: "FakeCategory" }
    }, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });
});

describe("validateCreateIssue Image Validation", () => {
  it("rejects malformed base64 image string", () => {
    const res = createMockRes();
    validateCreateIssue({
      body: { title: "Valid title", description: "Valid detailed description", location: "Valid location", image: "not-a-data-uri" }
    }, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });

  it("rejects oversized base64 image exceeding 2MB limit", () => {
    const res = createMockRes();
    const big = "data:image/png;base64," + "A".repeat(3 * 1024 * 1024);
    validateCreateIssue({
      body: { title: "Valid title", description: "Valid description", location: "Valid location", image: big }
    }, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });

  it("accepts valid issue payload and invokes next()", () => {
    const res = createMockRes();
    const next = vi.fn();
    validateCreateIssue({
      body: {
        title: "Valid pothole report",
        description: "Deep pothole causing vehicle tire damage",
        location: "Corner of 5th Avenue",
        category: "Roads & Transport",
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      }
    }, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("validateUpdateIssueStatus Rejections", () => {
  it("rejects non-object body or empty updates with 400", () => {
    const res = createMockRes();
    validateUpdateIssueStatus({ body: null }, res, vi.fn());
    expect(res.statusCode).toBe(400);

    const res2 = createMockRes();
    validateUpdateIssueStatus({ body: {} }, res2, vi.fn());
    expect(res2.statusCode).toBe(400);
  });

  it("rejects invalid status or priority values", () => {
    const res = createMockRes();
    validateUpdateIssueStatus({
      body: { status: "InvalidStatus", priority: "SuperUrgent" }
    }, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });

  it("rejects invalid department length or non-string notes", () => {
    const res = createMockRes();
    validateUpdateIssueStatus({
      body: { department: "ab", resolutionNotes: 12345 }
    }, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });
});

describe("validateUpdateIssueStatus Success", () => {
  it("calls next() for valid status transition payload", () => {
    const res = createMockRes();
    const next = vi.fn();
    validateUpdateIssueStatus({
      body: {
        status: "In Progress",
        priority: "High",
        department: "Public Works Department",
        resolutionNotes: "Crew en route"
      }
    }, res, next);
    expect(next).toHaveBeenCalled();
  });
});
