import { describe, it, expect, vi } from "vitest";

vi.mock("openai", () => ({
  default: class {
    constructor() {}
    chat = { completions: { create: vi.fn() } };
  },
}));

import { validateInterviewPrepResult } from "@/lib/ai/interview-prep";
import type { InterviewPrepData } from "@/lib/ai/interview-prep";
import { buildInterviewPrepPrompt } from "@/lib/ai/prompts";
import completeFixture from "./fixtures/interview-prep-complete.json";

// =============================================================================
// Group 1: validateInterviewPrepResult — complete data
// =============================================================================

describe("validateInterviewPrepResult", () => {
  it("returns a complete InterviewPrepData with all sections populated", () => {
    const result = validateInterviewPrepResult(completeFixture);

    expect(result.version).toBe(1);
    expect(result.generatedAt).toBe("2026-04-12T15:00:00.000Z");
    expect(result.stories).toHaveLength(3);
    expect(result.likelyQuestions).toHaveLength(10);
    expect(result.companySignals.values).toHaveLength(3);
    expect(result.companySignals.vocabularyToUse).toHaveLength(4);
    expect(result.companySignals.thingsToAvoid).toHaveLength(3);
    expect(result.companySignals.questionsToAsk).toHaveLength(4);
    expect(result.technicalChecklist).toHaveLength(4);
    expect(result.swissContext.culturalNotes).toHaveLength(4);
    expect(result.swissContext.salaryNegotiation).toContain("Genève");
  });

  it("stories have likelyQuestion field", () => {
    const result = validateInterviewPrepResult(completeFixture);
    for (const story of result.stories) {
      expect(story).toHaveProperty("likelyQuestion");
      expect(typeof story.likelyQuestion).toBe("string");
      expect(story.likelyQuestion.length).toBeGreaterThan(0);
    }
  });

  it("questions have valid categories", () => {
    const result = validateInterviewPrepResult(completeFixture);
    const validCategories = ["technical", "behavioral", "role_specific", "red_flag"];
    for (const q of result.likelyQuestions) {
      expect(validCategories).toContain(q.category);
    }
  });

  it("technicalChecklist items have valid priorities", () => {
    const result = validateInterviewPrepResult(completeFixture);
    const validPriorities = ["high", "medium", "low"];
    for (const item of result.technicalChecklist) {
      expect(validPriorities).toContain(item.priority);
    }
  });
});

// =============================================================================
// Group 2: validateInterviewPrepResult — partial / missing data
// =============================================================================

describe("validateInterviewPrepResult — graceful degradation", () => {
  it("fills missing sections with empty arrays/defaults without throwing", () => {
    const partial = {
      stories: [
        {
          requirement: "Test",
          situation: "S",
          task: "T",
          action: "A",
          result: "R",
          reflection: "Ref",
          likelyQuestion: "Q?",
        },
      ],
    };

    const result = validateInterviewPrepResult(partial);

    expect(result.version).toBe(1);
    expect(result.stories).toHaveLength(1);
    expect(result.likelyQuestions).toEqual([]);
    expect(result.companySignals).toEqual({
      values: [],
      vocabularyToUse: [],
      thingsToAvoid: [],
      questionsToAsk: [],
    });
    expect(result.technicalChecklist).toEqual([]);
    expect(result.swissContext).toEqual({
      salaryNegotiation: "",
      culturalNotes: [],
      marketPosition: "",
    });
  });

  it("handles completely invalid input (non-object) without throwing", () => {
    const result = validateInterviewPrepResult("invalid string");

    expect(result.version).toBe(1);
    expect(result.stories).toEqual([]);
    expect(result.likelyQuestions).toEqual([]);
  });

  it("handles null input without throwing", () => {
    const result = validateInterviewPrepResult(null);
    expect(result.version).toBe(1);
    expect(result.stories).toEqual([]);
  });

  it("handles empty object without throwing", () => {
    const result = validateInterviewPrepResult({});
    expect(result.version).toBe(1);
    expect(result.stories).toEqual([]);
    expect(result.likelyQuestions).toEqual([]);
    expect(result.technicalChecklist).toEqual([]);
  });

  it("defaults invalid category to 'behavioral'", () => {
    const data = {
      likelyQuestions: [
        { question: "Q?", category: "INVALID", why: "w", suggestedAngle: "a" },
      ],
    };
    const result = validateInterviewPrepResult(data);
    expect(result.likelyQuestions[0].category).toBe("behavioral");
  });

  it("defaults invalid priority to 'medium'", () => {
    const data = {
      technicalChecklist: [
        { topic: "T", why: "w", priority: "INVALID" },
      ],
    };
    const result = validateInterviewPrepResult(data);
    expect(result.technicalChecklist[0].priority).toBe("medium");
  });

  it("coerces missing story fields to empty strings", () => {
    const data = {
      stories: [{ requirement: "Test" }],
    };
    const result = validateInterviewPrepResult(data);
    expect(result.stories[0].situation).toBe("");
    expect(result.stories[0].task).toBe("");
    expect(result.stories[0].action).toBe("");
    expect(result.stories[0].result).toBe("");
    expect(result.stories[0].reflection).toBe("");
    expect(result.stories[0].likelyQuestion).toBe("");
  });
});

// =============================================================================
// Group 3: buildInterviewPrepPrompt — content checks
// =============================================================================

describe("buildInterviewPrepPrompt", () => {
  const prompt = buildInterviewPrepPrompt();

  it("contains Swiss market markers: Genève, LPP, CCT", () => {
    expect(prompt).toContain("Genève");
    expect(prompt).toContain("LPP");
    expect(prompt).toContain("CCT");
  });

  it("mentions STAR+R format", () => {
    expect(prompt).toMatch(/STAR\+R/);
  });

  it("includes the [inferred from JD] label rule", () => {
    expect(prompt).toContain("[inferred from JD]");
  });

  it("includes diploma equivalences table", () => {
    expect(prompt).toMatch(/CFC|Bachelor|Master|HES/i);
  });

  it("specifies story count range (3 to 5)", () => {
    expect(prompt).toMatch(/3\s*[àa]\s*5\s*stories/i);
  });

  it("specifies question count range (8 to 15)", () => {
    expect(prompt).toMatch(/8\s*[àa]\s*15/);
  });

  it("specifies technical checklist range (3 to 6)", () => {
    expect(prompt).toMatch(/3\s*[àa]\s*6/);
  });

  it("contains salary negotiation guidance", () => {
    expect(prompt).toContain("brut annuel");
    expect(prompt).toContain("13e mois");
  });

  it("includes JSON format specification with all sections", () => {
    expect(prompt).toContain('"stories"');
    expect(prompt).toContain('"likelyQuestions"');
    expect(prompt).toContain('"companySignals"');
    expect(prompt).toContain('"technicalChecklist"');
    expect(prompt).toContain('"swissContext"');
  });
});

// =============================================================================
// Group 4: InterviewPrepData type contract
// =============================================================================

describe("InterviewPrepData type contract", () => {
  it("version is always 1", () => {
    const result = validateInterviewPrepResult(completeFixture);
    expect(result.version).toBe(1);
  });

  it("generatedAt is an ISO date string", () => {
    const result = validateInterviewPrepResult(completeFixture);
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
  });

  it("defaults generatedAt to current time when missing", () => {
    const before = new Date().toISOString();
    const result = validateInterviewPrepResult({});
    const after = new Date().toISOString();
    expect(result.generatedAt >= before).toBe(true);
    expect(result.generatedAt <= after).toBe(true);
  });

  it("stories have all STAR+R fields plus likelyQuestion", () => {
    const result = validateInterviewPrepResult(completeFixture);
    const story = result.stories[0];
    expect(story).toHaveProperty("requirement");
    expect(story).toHaveProperty("situation");
    expect(story).toHaveProperty("task");
    expect(story).toHaveProperty("action");
    expect(story).toHaveProperty("result");
    expect(story).toHaveProperty("reflection");
    expect(story).toHaveProperty("likelyQuestion");
  });

  it("at least one red_flag question exists in complete fixture", () => {
    const result = validateInterviewPrepResult(completeFixture);
    const redFlags = result.likelyQuestions.filter((q) => q.category === "red_flag");
    expect(redFlags.length).toBeGreaterThanOrEqual(1);
  });
});
