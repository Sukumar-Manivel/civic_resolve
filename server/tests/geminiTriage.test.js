import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { triageIssue, resetTriageCache, setCachedTriage, getCachedTriage } from "../src/services/geminiTriageService.js";
import { GoogleGenAI } from "@google/genai";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn()
  };
});

function setupActiveKey() {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    vi.clearAllMocks();
    resetTriageCache();
    process.env.GEMINI_API_KEY = "active-test-key";
  });
  afterEach(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });
}

describe("Gemini Triage Without API Key", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    resetTriageCache();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it("uses rule-engine fallback when GEMINI_API_KEY is unset", async () => {
    const result = await triageIssue({
      title: "Broken street lamp",
      description: "Pole sparking near sidewalk",
      location: "Main Street",
      category: null
    });
    expect(result.triageSource).toBe("rule-engine");
    expect(result.category).toBe("Electrical & Lighting");
  });
});

describe("Gemini Triage Active Key Success", () => {
  setupActiveKey();

  it("triages successfully using Gemini API when key is present", async () => {
    GoogleGenAI.mockImplementation(function () {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              category: "Roads & Transport",
              priority: "High",
              department: "Public Works Department",
              urgencyReason: "High-risk pothole cluster",
              estimatedResolutionHours: 24
            })
          })
        }
      };
    });

    const result = await triageIssue({
      title: "Crater on Avenue",
      description: "Vehicles swerving to avoid ditch",
      location: "MG Road"
    });

    expect(result.triageSource).toBe("gemini");
    expect(result.category).toBe("Roads & Transport");
  });
});

describe("Gemini Triage Active Key Fallbacks", () => {
  setupActiveKey();

  it("applies default values when Gemini returns empty or partial fields", async () => {
    GoogleGenAI.mockImplementation(function () {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify({}) })
        }
      };
    });

    const fallback = await triageIssue({
      title: "Unknown issue",
      description: "Needs attention",
      location: "Center"
    });
    expect(fallback.category).toBe("General Administration");
    expect(fallback.priority).toBe("Medium");
  });
});

describe("Gemini Triage Error Handling & Caching", () => {
  beforeEach(() => {
    resetTriageCache();
  });

  it("falls back to rule engine with diagnostic warning when Gemini throws", async () => {
    process.env.GEMINI_API_KEY = "test-api-key";
    GoogleGenAI.mockImplementation(function () {
      return {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error("Rate limit exceeded"))
        }
      };
    });

    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = await triageIssue({
      title: "Garbage pile",
      description: "Overflowing commercial bin",
      location: "Market Gate"
    });

    expect(result.triageSource).toBe("rule-engine");
    expect(result.category).toBe("Sanitation & Waste");
    expect(stderrSpy).toHaveBeenCalled();
    stderrSpy.mockRestore();
  });

  it("stores and retrieves cached triage entries", () => {
    setCachedTriage("p::d::l", { category: "Roads & Transport", priority: "Low" });
    const hit = getCachedTriage("p::d::l");
    expect(hit.category).toBe("Roads & Transport");
  });
});
