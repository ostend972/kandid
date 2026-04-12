import { describe, it, expect } from "vitest";
import {
  normalizeForATS,
  normalizeGeneratedCv,
  extractATSKeywords,
} from "@/lib/ai/normalize-ats";
import type { GeneratedCvData } from "@/lib/ai/generate-cv";

// ---------------------------------------------------------------------------
// normalizeForATS
// ---------------------------------------------------------------------------

describe("normalizeForATS", () => {
  it("replaces em-dash with hyphen", () => {
    expect(normalizeForATS("full\u2014time")).toBe("full-time");
  });

  it("replaces en-dash with hyphen", () => {
    expect(normalizeForATS("2020\u20132024")).toBe("2020-2024");
  });

  it("replaces smart double quotes with straight quotes", () => {
    expect(normalizeForATS("\u201CHello\u201D")).toBe('"Hello"');
  });

  it("replaces smart single quotes with apostrophe", () => {
    expect(normalizeForATS("\u2018it\u2019s")).toBe("'it's");
  });

  it("replaces ellipsis with three dots", () => {
    expect(normalizeForATS("loading\u2026")).toBe("loading...");
  });

  it("strips zero-width chars", () => {
    expect(normalizeForATS("he\u200Bllo\uFEFF")).toBe("hello");
  });

  it("replaces non-breaking space with regular space", () => {
    expect(normalizeForATS("hello\u00A0world")).toBe("hello world");
  });

  it("preserves French accents", () => {
    expect(normalizeForATS("résumé über à côté")).toBe("résumé über à côté");
  });

  it("passes empty string through", () => {
    expect(normalizeForATS("")).toBe("");
  });

  it("passes plain ASCII through unchanged", () => {
    const ascii = "Hello World 123 - test@mail.com";
    expect(normalizeForATS(ascii)).toBe(ascii);
  });
});

// ---------------------------------------------------------------------------
// normalizeGeneratedCv
// ---------------------------------------------------------------------------

describe("normalizeGeneratedCv", () => {
  const base: GeneratedCvData = {
    identity: {
      firstName: "Jean",
      lastName: "Dupont",
      title: "D\u00e9veloppeur Full\u2014Stack",
      address: "Gen\u00e8ve",
      phone: "+41 79 000 00 00",
      email: "jean@example.com",
      nationality: "Suisse",
      dateOfBirth: "01.01.1990",
      civilStatus: "C\u00e9libataire",
    },
    experiences: [
      {
        title: "Ing\u00e9nieur\u00A0logiciel",
        company: "ACME",
        location: "Gen\u00e8ve",
        startDate: "2020",
        endDate: "2024",
        contractType: "CDI",
        bullets: [
          "Impl\u00e9ment\u00e9 CI\u2013CD pipeline",
          "Livraison continue\u2026",
        ],
      },
    ],
    education: [],
    skills: [
      { category: "Frontend", items: ["React", "TypeScript\u200B"] },
    ],
    languages: [{ language: "Fran\u00e7ais", level: "C2" }],
    interests: ["Sport"],
  };

  it("normalizes top-level string fields", () => {
    const result = normalizeGeneratedCv(base);
    expect(result.identity.title).toBe("Développeur Full-Stack");
  });

  it("normalizes nested array strings (experiences bullets)", () => {
    const result = normalizeGeneratedCv(base);
    expect(result.experiences[0].bullets[0]).toBe("Implémenté CI-CD pipeline");
    expect(result.experiences[0].bullets[1]).toBe("Livraison continue...");
  });

  it("normalizes skills items", () => {
    const result = normalizeGeneratedCv(base);
    expect(result.skills[0].items[1]).toBe("TypeScript");
  });

  it("normalizes nbsp in experience title", () => {
    const result = normalizeGeneratedCv(base);
    expect(result.experiences[0].title).toBe("Ingénieur logiciel");
  });

  it("handles optional fields being undefined", () => {
    const sparse: GeneratedCvData = {
      ...base,
      references: undefined,
    };
    expect(() => normalizeGeneratedCv(sparse)).not.toThrow();
  });

  it("returns a new object (no mutation)", () => {
    const result = normalizeGeneratedCv(base);
    expect(result).not.toBe(base);
    expect(result.identity).not.toBe(base.identity);
    expect(result.experiences[0].bullets).not.toBe(base.experiences[0].bullets);
  });
});

// ---------------------------------------------------------------------------
// extractATSKeywords
// ---------------------------------------------------------------------------

describe("extractATSKeywords", () => {
  const realisticJD = `
Nous recherchons un développeur Full-Stack expérimenté.
Compétences requises:
• React, TypeScript, Node.js
• CI/CD, Docker, Kubernetes
• Méthodologie Agile / Scrum
• PostgreSQL, Redis
Expérience avec REST API et GraphQL souhaitée.
Bonne maîtrise de Git et GitHub Actions.
`;

  it("extracts technical terms from a realistic JD", () => {
    const keywords = extractATSKeywords(realisticJD);
    const joined = keywords.join(" ").toLowerCase();
    expect(joined).toContain("git");
    expect(joined).toContain("api");
    expect(joined).toContain("agile");
    expect(keywords.length).toBeGreaterThan(0);
  });

  it("returns deduplicated results (case-insensitive)", () => {
    const jd = "React react REACT\nReact Developer";
    const keywords = extractATSKeywords(jd);
    const lowerSet = new Set(keywords.map((k) => k.toLowerCase()));
    const reactCount = keywords.filter(
      (k) => k.toLowerCase() === "react"
    ).length;
    expect(reactCount).toBeLessThanOrEqual(1);
  });

  it("returns empty array for empty string", () => {
    expect(extractATSKeywords("")).toEqual([]);
  });

  it("caps output at 20 max", () => {
    const longJD = Array.from(
      { length: 50 },
      (_, i) => `Skill${i} Framework${i} Tool${i}`
    ).join("\n");
    const keywords = extractATSKeywords(longJD);
    expect(keywords.length).toBeLessThanOrEqual(20);
  });

  it("does not include common stopwords", () => {
    const jd = "the and de le React TypeScript pour with";
    const keywords = extractATSKeywords(jd);
    const lower = keywords.map((k) => k.toLowerCase());
    expect(lower).not.toContain("the");
    expect(lower).not.toContain("and");
    expect(lower).not.toContain("de");
    expect(lower).not.toContain("le");
  });
});
