import { GoogleGenAI } from "@google/genai";
import { classifyIssueWithRules } from "./triageRules.js";
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES } from "../utils/constants.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
export const triageCache = new Map();

const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ISSUE_CATEGORIES },
    priority: { type: "string", enum: ISSUE_PRIORITIES },
    department: { type: "string" },
    urgencyReason: { type: "string" },
    estimatedResolutionHours: { type: "number" }
  },
  required: ["category", "priority", "department", "urgencyReason", "estimatedResolutionHours"]
};

function buildCacheKey(issue) {
  const t = (issue.title || "").toLowerCase().trim();
  const d = (issue.description || "").toLowerCase().trim();
  const loc = (issue.location || "").toLowerCase().trim();
  return `${t}::${d}::${loc}`;
}

export function getCachedTriage(key, now = Date.now()) {
  const entry = triageCache.get(key);
  if (!entry) return null;
  if (now - entry.cachedAt > CACHE_TTL_MS) {
    triageCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedTriage(key, data, now = Date.now()) {
  if (triageCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = triageCache.keys().next().value;
    triageCache.delete(oldestKey);
  }
  triageCache.set(key, { cachedAt: now, data });
}

export function resetTriageCache() {
  triageCache.clear();
}

function buildPrompt(issue) {
  return [
    "You are a municipal dispatch AI. Triage this citizen complaint into exact category, priority, department, urgencyReason, and estimatedResolutionHours.",
    `Title: ${issue.title}`,
    `Description: ${issue.description}`,
    `Location: ${issue.location}`,
    `Preferred Category: ${issue.category || "Auto-Detect"}`
  ].join("\n");
}

async function callGeminiApi(apiKey, promptText) {
  const ai = new GoogleGenAI({ apiKey });
  const signal = AbortSignal.timeout(5000);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: TRIAGE_SCHEMA,
      abortSignal: signal
    }
  });
  return JSON.parse(response.text);
}

async function executeTriage(issue, apiKey) {
  if (!apiKey) {
    return classifyIssueWithRules(issue);
  }
  try {
    const prompt = buildPrompt(issue);
    const parsed = await callGeminiApi(apiKey, prompt);
    return {
      category: parsed.category || "General Administration",
      priority: parsed.priority || "Medium",
      department: parsed.department || "Citizen Grievance Redressal Cell",
      urgencyReason: parsed.urgencyReason || "Assessed via automated triage.",
      estimatedResolutionHours: Number(parsed.estimatedResolutionHours) || 24,
      triageSource: "gemini"
    };
  } catch (err) {
    process.stderr.write(`[Gemini Triage Warning] Upstream failure (${err.message}). Using fallback.\n`);
    return classifyIssueWithRules(issue);
  }
}

/**
 * Triages an issue with memoization caching.
 * @param {object} issue - Complaint payload
 * @returns {Promise<object>} Triage assessment
 */
export async function triageIssue(issue) {
  const cacheKey = buildCacheKey(issue);
  const cached = getCachedTriage(cacheKey);
  if (cached) {
    return cached;
  }
  const result = await executeTriage(issue, process.env.GEMINI_API_KEY);
  setCachedTriage(cacheKey, result);
  return result;
}
