import { describe, it, expect } from "vitest";
import { classifyLiveness } from "../kandid-scraper/liveness-check";

const LONG_BODY = "a".repeat(400);

describe("classifyLiveness", () => {
  // --- HTTP status checks ---
  it("returns expired for HTTP 404", () => {
    const r = classifyLiveness({ status: 404, bodyText: LONG_BODY });
    expect(r).toEqual({ result: "expired", reason: "HTTP 404" });
  });

  it("returns expired for HTTP 410", () => {
    const r = classifyLiveness({ status: 410, bodyText: LONG_BODY });
    expect(r).toEqual({ result: "expired", reason: "HTTP 410" });
  });

  // --- URL redirect checks ---
  it("returns expired for URL with ?error=true", () => {
    const r = classifyLiveness({
      status: 200,
      finalUrl: "https://example.com/jobs?error=true",
      bodyText: LONG_BODY,
    });
    expect(r.result).toBe("expired");
    expect(r.reason).toContain("redirect to");
  });

  it("returns expired for URL with &error=true", () => {
    const r = classifyLiveness({
      status: 200,
      finalUrl: "https://example.com/jobs?page=1&error=true",
      bodyText: LONG_BODY,
    });
    expect(r.result).toBe("expired");
  });

  // --- Body expired patterns (EN) ---
  it("returns expired for 'job no longer available'", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: "Sorry, this job is no longer available.",
    });
    expect(r.result).toBe("expired");
    expect(r.reason).toContain("pattern matched");
  });

  it("returns expired for 'position has been filled'", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " This position has been filled.",
    });
    expect(r.result).toBe("expired");
  });

  it("returns expired for 'this job has expired'", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " this job has expired",
    });
    expect(r.result).toBe("expired");
  });

  // --- Body expired patterns (DE) ---
  it("returns expired for German 'diese stelle nicht mehr besetzt'", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " Diese Stelle ist nicht mehr besetzt.",
    });
    expect(r.result).toBe("expired");
  });

  // --- Body expired patterns (FR) ---
  it("returns expired for French 'offre expirée'", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " Cette offre expirée n'est plus disponible.",
    });
    expect(r.result).toBe("expired");
  });

  // --- Apply control detection ---
  it("returns active when apply button is present", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY,
      applyControls: ["Apply Now"],
    });
    expect(r).toEqual({ result: "active", reason: "visible apply control detected" });
  });

  it("returns active for German 'Bewerben' control", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY,
      applyControls: ["Jetzt Bewerben"],
    });
    expect(r.result).toBe("active");
  });

  it("returns active for French 'Postuler' control", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY,
      applyControls: ["Postuler maintenant"],
    });
    expect(r.result).toBe("active");
  });

  // --- Listing page detection ---
  it("returns expired for listing page pattern", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " 42 jobs found matching your criteria",
    });
    expect(r.result).toBe("expired");
    expect(r.reason).toContain("pattern matched");
  });

  // --- Content length checks ---
  it("returns expired when body is shorter than 300 chars", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: "Navigation bar. Footer.",
    });
    expect(r.result).toBe("expired");
    expect(r.reason).toContain("insufficient content");
  });

  it("returns uncertain when body >= 300 chars but no apply control", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY,
    });
    expect(r).toEqual({
      result: "uncertain",
      reason: "content present but no visible apply control found",
    });
  });

  // --- Boundary: exactly 300 chars ---
  it("returns uncertain for body exactly 300 chars (boundary)", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: "x".repeat(300),
    });
    expect(r.result).toBe("uncertain");
  });

  it("returns expired for body 299 chars (just below threshold)", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: "x".repeat(299),
    });
    expect(r.result).toBe("expired");
  });

  // --- Priority chain: HTTP status wins over body patterns ---
  it("HTTP status takes priority over apply controls", () => {
    const r = classifyLiveness({
      status: 404,
      bodyText: LONG_BODY,
      applyControls: ["Apply Now"],
    });
    expect(r.result).toBe("expired");
    expect(r.reason).toBe("HTTP 404");
  });

  // --- Priority chain: body pattern wins over apply controls ---
  it("body expired pattern takes priority over apply controls", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " this job has expired",
      applyControls: ["Apply Now"],
    });
    expect(r.result).toBe("expired");
  });

  // --- Malformed / empty inputs ---
  it("returns expired for all empty inputs (default)", () => {
    const r = classifyLiveness({});
    expect(r.result).toBe("expired");
    expect(r.reason).toContain("insufficient content");
  });

  it("returns expired for no arguments at all", () => {
    const r = classifyLiveness();
    expect(r.result).toBe("expired");
  });

  it("returns expired for zero status with empty body", () => {
    const r = classifyLiveness({ status: 0, finalUrl: "", bodyText: "", applyControls: [] });
    expect(r.result).toBe("expired");
  });

  // --- Mixed language in body ---
  it("detects French pattern even with mixed-language body", () => {
    const r = classifyLiveness({
      status: 200,
      bodyText: LONG_BODY + " This role — offre n'est plus disponible — was posted last week.",
    });
    expect(r.result).toBe("expired");
  });
});
