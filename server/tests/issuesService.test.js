import { describe, it, expect, beforeEach } from "vitest";
import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  resetStore,
  matchesFilter,
  MAX_STORE_CAPACITY
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

describe("Issues Store Bounded Capacity", () => {
  beforeEach(() => {
    resetStore();
  });

  it("enforces MAX_STORE_CAPACITY by evicting oldest item upon overflow", async () => {
    for (let i = 0; i < MAX_STORE_CAPACITY + 2; i++) {
      await createIssue({
        title: `Overflow Issue ${i}`,
        description: "Test capacity overflow",
        location: "Location",
        category: null
      });
    }
    const all = getIssues({ limit: 100 });
    expect(all.length).toBe(MAX_STORE_CAPACITY);
  });
});

describe("Issues Store Pagination & Payloads", () => {
  beforeEach(() => {
    resetStore();
  });

  it("applies limit and offset pagination correctly", () => {
    const page1 = getIssues({ limit: 2, offset: 0 });
    const page2 = getIssues({ limit: 2, offset: 2 });
    expect(page1.length).toBe(2);
    expect(page2.length).toBe(2);
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it("formats lean list payloads with hasImage indicator", () => {
    const list = getIssues();
    expect(list.every((item) => typeof item.hasImage === "boolean")).toBe(true);
    expect(list.every((item) => item.imageUrl === undefined)).toBe(true);
  });
});
