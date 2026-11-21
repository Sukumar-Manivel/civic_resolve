import { describe, it, expect, beforeEach } from "vitest";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  resetStore,
  matchesFilter
} from "../src/services/issuesService.js";

describe("Issues Store Retrieval", () => {
  beforeEach(() => {
    resetStore();
  });

  it("returns initial seeded issues sorted by createdAt descending", () => {
    const list = getIssues();
    expect(list.length).toBeGreaterThanOrEqual(4);
    expect(list[0].id).toBeDefined();
  });

  it("retrieves issue by ID or returns null if not found", () => {
    const found = getIssueById("civic-seed-001");
    expect(found).not.toBeNull();
    expect(getIssueById("invalid-id-xyz")).toBeNull();
  });
});

describe("Issues Store Filtering", () => {
  beforeEach(() => {
    resetStore();
  });

  it("filters issues accurately by status, category, and search query", () => {
    const reported = getIssues({ status: "Reported" });
    expect(reported.every((i) => i.status === "Reported")).toBe(true);

    const roads = getIssues({ category: "Roads & Transport" });
    expect(roads.every((i) => i.category === "Roads & Transport")).toBe(true);

    const searched = getIssues({ search: "Gandhi Nagar" });
    expect(searched.length).toBe(1);
  });

  it("matchesFilter handles undefined or empty filter clauses", () => {
    const dummy = { status: "Reported", category: "Roads & Transport", title: "A", description: "B", location: "C" };
    expect(matchesFilter(dummy, {})).toBe(true);
    expect(matchesFilter(dummy, { status: "Resolved" })).toBe(false);
  });
});

describe("Issues Store Mutation", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates a new issue with unique ID and rule triage", async () => {
    const created = await createIssue({
      title: "Broken streetlight sparking",
      description: "Hanging wire over road",
      location: "Cross Road 5",
      category: null,
      image: null
    });
    expect(created.id.startsWith("civic-")).toBe(true);
    expect(created.status).toBe("Reported");
  });

  it("updates issue status, priority, and resolution notes cleanly", () => {
    const updated = updateIssue("civic-seed-002", {
      status: "In Progress",
      priority: "High",
      department: "Rapid Force",
      resolutionNotes: "Dispatched truck."
    });
    expect(updated.status).toBe("In Progress");

    const partial = updateIssue("civic-seed-002", { status: "Resolved" });
    expect(partial.status).toBe("Resolved");
    expect(updateIssue("unknown-id", { status: "Resolved" })).toBeNull();
  });
});
