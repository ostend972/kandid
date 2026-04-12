import { describe, it, expect, vi } from "vitest";

vi.mock("openai", () => ({
  default: class {
    constructor() {}
    chat = { completions: { create: vi.fn() } };
  },
}));

import { validateStructuredResult } from "@/lib/ai/match-job";
import { buildStructuredMatchPrompt } from "@/lib/ai/prompts";
import v2Complete from "./fixtures/match-v2-complete.json";
import v1Legacy from "./fixtures/match-v1-legacy.json";

// =============================================================================
// Group 1: validateStructuredResult
// =============================================================================

describe("validateStructuredResult", () => {
  it("returns a complete StructuredMatchResult with all blocks populated", () => {
    const result = validateStructuredResult(v2Complete);

    expect(result.matchVersion).toBe(2);
    expect(result.overallScore).toBe(78);
    expect(result.verdict).toBe("excellent");
    expect(result.blocks.a).not.toBeNull();
    expect(result.blocks.b).not.toBeNull();
    expect(result.blocks.c).not.toBeNull();
    expect(result.blocks.d).not.toBeNull();
    expect(result.blocks.e).not.toBeNull();
    expect(result.blocks.f).not.toBeNull();
    expect(result.blocks.a!.archetype).toBe("IC Senior");
    expect(result.blocks.b!.requirements).toHaveLength(2);
  });

  it("sets missing blocks to null without throwing", () => {
    const partial = {
      overallScore: 65,
      verdict: "partial",
      blocks: {
        a: { archetype: "Manager", domain: "IT", function: "RH", seniority: "mid", remotePolicy: "présentiel", teamSize: "5", tldr: "Test" },
        b: { requirements: [] },
      },
    };

    const result = validateStructuredResult(partial);

    expect(result.blocks.a).not.toBeNull();
    expect(result.blocks.b).not.toBeNull();
    expect(result.blocks.c).toBeNull();
    expect(result.blocks.d).toBeNull();
    expect(result.blocks.e).toBeNull();
    expect(result.blocks.f).toBeNull();
    expect(result.overallScore).toBe(65);
  });

  it("defaults overallScore to 50 and infers verdict when input has no blocks or score", () => {
    const invalid = { foo: "bar" };
    const result = validateStructuredResult(invalid);

    expect(result.matchVersion).toBe(2);
    expect(result.overallScore).toBe(50);
    expect(result.verdict).toBe("partial");
    expect(result.blocks.a).toBeNull();
    expect(result.blocks.b).toBeNull();
    expect(result.blocks.c).toBeNull();
    expect(result.blocks.d).toBeNull();
    expect(result.blocks.e).toBeNull();
    expect(result.blocks.f).toBeNull();
  });

  it("clamps overallScore to 0-100 range", () => {
    const over = { overallScore: 150, verdict: "excellent", blocks: {} };
    expect(validateStructuredResult(over).overallScore).toBe(100);

    const under = { overallScore: -20, verdict: "low", blocks: {} };
    expect(validateStructuredResult(under).overallScore).toBe(0);
  });
});

// =============================================================================
// Group 2: buildStructuredMatchPrompt
// =============================================================================

describe("buildStructuredMatchPrompt", () => {
  const prompt = buildStructuredMatchPrompt();

  it("contains Swiss market markers: LPP, 13e mois, Genève", () => {
    expect(prompt).toContain("LPP");
    expect(prompt).toContain("13e mois");
    expect(prompt).toContain("Genève");
  });

  it("contains all 6 block keys in the JSON format spec", () => {
    expect(prompt).toContain('"a"');
    expect(prompt).toContain('"b"');
    expect(prompt).toContain('"c"');
    expect(prompt).toContain('"d"');
    expect(prompt).toContain('"e"');
    expect(prompt).toContain('"f"');
  });

  it("includes diploma equivalences table", () => {
    expect(prompt).toMatch(/CFC|Bachelor|Master|HES/i);
  });
});

// =============================================================================
// Group 3: Backward compatibility (v1/v2 format detection)
// =============================================================================

describe("v1/v2 format detection", () => {
  it("detects v2 format: object with matchVersion 2 and blocks", () => {
    const data = v2Complete;
    const isV2 = typeof data === "object" && !Array.isArray(data) && data.matchVersion === 2 && "blocks" in data;
    expect(isV2).toBe(true);
  });

  it("detects v1 format: array of requirements", () => {
    const data = v1Legacy;
    const isV1 = Array.isArray(data);
    expect(isV1).toBe(true);
  });

  it("detects v1 format: object without matchVersion", () => {
    const data = { overallScore: 72, verdict: "partial", requirements: [{ requirement: "Test", status: "met", explanation: "ok" }] };
    const isV2 = typeof data === "object" && !Array.isArray(data) && (data as Record<string, unknown>).matchVersion === 2;
    expect(isV2).toBe(false);
  });
});
