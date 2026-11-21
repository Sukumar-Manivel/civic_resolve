import crypto from "node:crypto";
import { SEED_ISSUES } from "../utils/seedData.js";
import { triageIssue } from "./geminiTriageService.js";

/** Bounded capacity for FIFO municipal grievance store */
export const MAX_STORE_CAPACITY = 100;

export const issuesStore = new Map();

/**
 * Resets the in-memory grievance store to initial seed state.
 */
export function resetStore() {
  issuesStore.clear();
  for (const issue of SEED_ISSUES) {
    issuesStore.set(issue.id, {
      ...issue,
      hasImage: Boolean(issue.imageUrl)
    });
  }
}

resetStore();

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
 * Formats an issue record for list views with lean payload.
 * @param {object} issue - Raw issue record
 * @returns {object} Lean issue summary
 */
function toLeanSummary(issue) {
  const { imageUrl, ...rest } = issue;
  return { ...rest, hasImage: Boolean(imageUrl) };
}

/**
 * Retrieves all issues matching optional query filters with pagination.
 * @param {object} [filters={}] - Optional filters with limit/offset
 * @returns {Array<object>} Matching issue records
 */
export function getIssues(filters = {}) {
  const limit = Math.max(1, Math.min(100, Number(filters.limit) || 50));
  const offset = Math.max(0, Number(filters.offset) || 0);
  const results = [];

  for (const issue of issuesStore.values()) {
    if (matchesFilter(issue, filters)) {
      results.push(toLeanSummary(issue));
    }
  }

  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return results.slice(offset, offset + limit);
}

/**
 * Retrieves a single issue by its unique ID with full payload.
 * @param {string} id - Issue ID
 * @returns {object|null} Found issue or null
 */
export function getIssueById(id) {
  return issuesStore.get(id) || null;
}

/**
 * Assembles a standardized issue record from citizen input and AI triage.
 * @param {object} input - Input grievance payload
 * @param {object} triage - AI triage classification
 * @param {string} id - Unique issue identifier
 * @param {string} now - ISO 8601 timestamp
 * @returns {object} Assembled issue record
 */
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
    hasImage: Boolean(input.image),
    resolutionNotes: null,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Creates and stores a new citizen issue with AI triage and O(1) FIFO eviction.
 * @param {object} input - Citizen issue payload
 * @returns {Promise<object>} Created issue record
 */
export async function createIssue(input) {
  const triage = await triageIssue(input);
  const now = new Date().toISOString();
  const id = `civic-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const newIssue = buildNewIssueRecord(input, triage, id, now);

  if (issuesStore.size >= MAX_STORE_CAPACITY) {
    const oldestKey = issuesStore.keys().next().value;
    issuesStore.delete(oldestKey);
  }

  issuesStore.set(id, newIssue);
  return newIssue;
}

/**
 * Updates municipal status, priority, or notes on an issue with O(1) Map update.
 * @param {string} id - Issue ID
 * @param {object} updateData - Changes to apply
 * @returns {object|null} Updated issue or null if not found
 */
export function updateIssue(id, updateData) {
  if (!issuesStore.has(id)) return null;

  const current = issuesStore.get(id);
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

  issuesStore.set(id, updated);
  return updated;
}
