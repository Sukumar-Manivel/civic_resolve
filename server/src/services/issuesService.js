import crypto from "node:crypto";
import { SEED_ISSUES } from "../utils/seedData.js";
import { triageIssue } from "./geminiTriageService.js";

/** Bounded capacity for FIFO municipal grievance store */
export const MAX_STORE_CAPACITY = 100;

let issuesStore = SEED_ISSUES.map((issue) => ({ ...issue }));

/**
 * Resets the in-memory grievance store to initial seed state.
 */
export function resetStore() {
  issuesStore = SEED_ISSUES.map((issue) => ({ ...issue }));
}

/**
 * Checks whether an issue matches given filter criteria.
 * @param {object} issue - Target issue record
 * @param {object} filters - { status, category, search }
 * @returns {boolean} Match result
 */
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

/**
 * Retrieves all issues matching optional query filters.
 * @param {object} [filters={}] - Optional filters
 * @returns {Array<object>} Matching issue records
 */
export function getIssues(filters = {}) {
  return issuesStore
    .filter((issue) => matchesFilter(issue, filters))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Retrieves a single issue by its unique ID.
 * @param {string} id - Issue ID
 * @returns {object|null} Found issue or null
 */
export function getIssueById(id) {
  return issuesStore.find((issue) => issue.id === id) || null;
}

function buildNewIssueRecord(input, triage, id, now) {
  return {
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
}

/**
 * Creates and stores a new citizen issue with AI triage.
 * @param {object} input - Citizen issue payload
 * @returns {Promise<object>} Created issue record
 */
export async function createIssue(input) {
  const triage = await triageIssue(input);
  const now = new Date().toISOString();
  const id = `civic-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const newIssue = buildNewIssueRecord(input, triage, id, now);

  if (issuesStore.length >= MAX_STORE_CAPACITY) {
    issuesStore.pop();
  }
  issuesStore.unshift(newIssue);
  return newIssue;
}

/**
 * Updates municipal status, priority, or notes on an issue.
 * @param {string} id - Issue ID
 * @param {object} updateData - Changes to apply
 * @returns {object|null} Updated issue or null if not found
 */
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
