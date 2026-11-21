import { DEPARTMENTS, ISSUE_CATEGORIES } from "../utils/constants.js";

const CATEGORY_KEYWORDS = [
  {
    category: "Electrical & Lighting",
    terms: ["electric", "spark", "wire", "cable", "shock", "light", "transformer", "pole"]
  },
  {
    category: "Water & Sewerage",
    terms: ["water", "sewage", "drain", "leak", "pipe", "turbid", "flood", "tap"]
  },
  {
    category: "Roads & Transport",
    terms: ["road", "pothole", "crater", "divider", "traffic", "signal", "footpath", "bridge"]
  },
  {
    category: "Sanitation & Waste",
    terms: ["garbage", "waste", "trash", "dump", "bin", "smell", "debris", "filth"]
  },
  {
    category: "Public Safety & Parks",
    terms: ["hazard", "fire", "danger", "collapse", "manhole", "tree", "branch", "park", "swing"]
  }
];

export function detectCategory(combinedText) {
  const lower = combinedText.toLowerCase();
  for (const item of CATEGORY_KEYWORDS) {
    if (item.terms.some((term) => lower.includes(term))) {
      return item.category;
    }
  }
  return "General Administration";
}

export function mapCategoryToDepartment(category) {
  const map = {
    "Sanitation & Waste": DEPARTMENTS.SANITATION,
    "Roads & Transport": DEPARTMENTS.ROADS,
    "Water & Sewerage": DEPARTMENTS.WATER,
    "Electrical & Lighting": DEPARTMENTS.ELECTRICAL,
    "Public Safety & Parks": DEPARTMENTS.SAFETY
  };
  return map[category] || DEPARTMENTS.GENERAL;
}

export function evaluatePriority(category, combinedText) {
  const lower = combinedText.toLowerCase();
  const criticalCues = ["spark", "shock", "live wire", "electrocution", "collapse", "poison", "fire"];
  if (criticalCues.some((cue) => lower.includes(cue))) {
    return { priority: "Critical", hours: 6, reason: "Severe immediate hazard to human safety or property." };
  }
  if (category === "Water & Sewerage" || category === "Roads & Transport") {
    return { priority: "High", hours: 24, reason: "Substantial disruption to essential infrastructure and transit." };
  }
  if (category === "Sanitation & Waste" || category === "Electrical & Lighting") {
    return { priority: "Medium", hours: 48, reason: "Public convenience disruption requiring scheduled municipal redressal." };
  }
  return { priority: "Low", hours: 72, reason: "Non-critical civic maintenance request." };
}

export function classifyIssueWithRules({ title, description, category }) {
  const combined = `${title} ${description}`;
  const resolvedCategory = category && ISSUE_CATEGORIES.includes(category)
    ? category
    : detectCategory(combined);
  const department = mapCategoryToDepartment(resolvedCategory);
  const { priority, hours, reason } = evaluatePriority(resolvedCategory, combined);

  return {
    category: resolvedCategory,
    priority,
    department,
    urgencyReason: reason,
    estimatedResolutionHours: hours,
    triageSource: "rule-engine"
  };
}
