import { describe, it, expect } from "vitest";
import {
  detectCategory,
  mapCategoryToDepartment,
  evaluatePriority,
  classifyIssueWithRules
} from "../src/services/triageRules.js";
import { DEPARTMENTS } from "../src/utils/constants.js";

describe("detectCategory and Department Mapping", () => {
  it("detectCategory identifies categories from keywords correctly", () => {
    expect(detectCategory("sparking high voltage wire")).toBe("Electrical & Lighting");
    expect(detectCategory("sewage pipeline ruptured tap")).toBe("Water & Sewerage");
    expect(detectCategory("major pothole and road crater")).toBe("Roads & Transport");
    expect(detectCategory("overflowing garbage bin dump")).toBe("Sanitation & Waste");
    expect(detectCategory("fallen tree branch in children park")).toBe("Public Safety & Parks");
    expect(detectCategory("unspecified civic inquiry")).toBe("General Administration");
  });

  it("mapCategoryToDepartment maps all categories to official departments", () => {
    expect(mapCategoryToDepartment("Sanitation & Waste")).toBe(DEPARTMENTS.SANITATION);
    expect(mapCategoryToDepartment("Roads & Transport")).toBe(DEPARTMENTS.ROADS);
    expect(mapCategoryToDepartment("Water & Sewerage")).toBe(DEPARTMENTS.WATER);
    expect(mapCategoryToDepartment("Electrical & Lighting")).toBe(DEPARTMENTS.ELECTRICAL);
    expect(mapCategoryToDepartment("Public Safety & Parks")).toBe(DEPARTMENTS.SAFETY);
    expect(mapCategoryToDepartment("Unknown Category")).toBe(DEPARTMENTS.GENERAL);
  });
});

describe("evaluatePriority Rules", () => {
  it("assigns appropriate priority, SLA hours, and rationale", () => {
    const critical = evaluatePriority("Electrical & Lighting", "live wire sparking near ground");
    expect(critical.priority).toBe("Critical");

    const high = evaluatePriority("Water & Sewerage", "broken water valve");
    expect(high.priority).toBe("High");

    const med = evaluatePriority("Sanitation & Waste", "dustbin cleaning needed");
    expect(med.priority).toBe("Medium");

    const low = evaluatePriority("General Administration", "request for info");
    expect(low.priority).toBe("Low");
  });
});

describe("classifyIssueWithRules Engine", () => {
  it("uses user-supplied category when valid", () => {
    const result = classifyIssueWithRules({
      title: "Clean sector",
      description: "Routine maintenance",
      category: "Sanitation & Waste"
    });
    expect(result.category).toBe("Sanitation & Waste");
    expect(result.department).toBe(DEPARTMENTS.SANITATION);
  });

  it("infers category when preferred category is absent", () => {
    const result = classifyIssueWithRules({
      title: "Broken street lamp",
      description: "Pole dark for three nights",
      category: null
    });
    expect(result.category).toBe("Electrical & Lighting");
  });
});
