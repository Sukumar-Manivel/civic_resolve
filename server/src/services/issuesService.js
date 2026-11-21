import crypto from "node:crypto";
import { SEED_ISSUES } from "../utils/seedData.js";
import { triageIssue } from "./geminiTriageService.js";

let issuesStore = SEED_ISSUES.map((issue) => ({ ...issue }));

export function resetStore() {
  issuesStore = SEED_ISSUES.map((issue) => ({ ...issue }));
}

export function matchesFilter(issue, { status, category, search }) {
  if (status && issue.status !== status) return false;
  if (category && issue.category !== category) return false;
  if (search) {
    const q = search.toLowerCase();
    const haystack = `${issue.title} ${issue.description} ${issue.location}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function getIssues(filters = {}) {
  return issuesStore
    .filter((issue) => matchesFilter(issue, filters))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getIssueById(id) {
  return issuesStore.find((issue) => issue.id === id) || null;
}

export async function createIssue(input) {
  const triage = await triageIssue(input);
  const now = new Date().toISOString();
  const id = `civic-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  const newIssue = {
    id,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    category: triage.category,
    priority: triage.priority,
    department: triage.department,
    status: "Reported",
    urgencyReason: triage.urgencyReason,
    estimatedResolutionHours: triage.estimatedResolutionHours,
    triageSource: triage.triageSource,
    imageUrl: input.image || null,
    resolutionNotes: null,
    createdAt: now,
    updatedAt: now
  };

  issuesStore.unshift(newIssue);
  return newIssue;
}

export function updateIssue(id, updateData) {
  const index = issuesStore.findIndex((issue) => issue.id === id);
  if (index === -1) return null;

  const current = issuesStore[index];
  const updated = {
    ...current,
    status: updateData.status || current.status,
    priority: updateData.priority || current.priority,
    department: updateData.department || current.department,
    resolutionNotes: updateData.resolutionNotes !== undefined
      ? updateData.resolutionNotes
      : current.resolutionNotes,
    updatedAt: new Date().toISOString()
  };

  issuesStore[index] = updated;
  return updated;
}
