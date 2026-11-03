import { describe, it, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";

describe("emailDetector", () => {
  it("detects standard valid emails with accurate field values", () => {
    const input = "Contact alex@example.com for info.";
    const result = emailDetector.detect(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "EMAIL",
      start: 8,
      end: 24,
      value: "alex@example.com",
      confidence: 1.0,
    });

    expect(input.slice(result[0].start, result[0].end)).toBe(
      "alex@example.com",
    );
  });

  it("detects multiple emails in one text string", () => {
    const input = "Send from dev@test.org to ops@test.org";
    const result = emailDetector.detect(input);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe("dev@test.org");
    expect(result[1].value).toBe("ops@test.org");
  });

  it("ignores malformed inputs like a@b or a@@b.com", () => {
    expect(emailDetector.detect("invalid email a@b")).toHaveLength(0);
    expect(emailDetector.detect("bad syntax a@@b.com")).toHaveLength(0);
  });

  it("extracts email correctly when embedded inside a URL", () => {
    const input = "Visit https://api.site.com/v1/user@domain.com/profile";
    const result = emailDetector.detect(input);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe("user@domain.com");
  });
});
