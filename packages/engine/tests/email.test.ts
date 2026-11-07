import { describe, it, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";

describe("emailDetector", () => {
  it("detects standard valid emails with accurate field values", () => {
    const input = "Contact alex@example.com for info.";
    const result = emailDetector.detect(input);
    const detection = result[0];

    expect(result).toHaveLength(1);
    if (detection === undefined) {
      throw new Error("Expected the email detector to return one detection");
    }

    expect(detection).toEqual({
      type: "EMAIL",
      start: 8,
      end: 24,
      value: "alex@example.com",
      confidence: 1.0,
    });

    expect(input.slice(detection.start, detection.end)).toBe("alex@example.com");
  });

  it("detects multiple emails in one text string", () => {
    const input = "Send from dev@test.org to ops@test.org";
    const result = emailDetector.detect(input);
    const first = result[0];
    const second = result[1];

    expect(result).toHaveLength(2);
    if (first === undefined || second === undefined) {
      throw new Error("Expected the email detector to return two detections");
    }

    expect(first.value).toBe("dev@test.org");
    expect(second.value).toBe("ops@test.org");
  });

  it("ignores malformed inputs like a@b or a@@b.com", () => {
    expect(emailDetector.detect("invalid email a@b")).toHaveLength(0);
    expect(emailDetector.detect("bad syntax a@@b.com")).toHaveLength(0);
  });

  it("extracts email correctly when embedded inside a URL", () => {
    const input = "Visit https://api.site.com/v1/user@domain.com/profile";
    const result = emailDetector.detect(input);
    const detection = result[0];

    expect(result).toHaveLength(1);
    if (detection === undefined) {
      throw new Error("Expected the email detector to return one detection");
    }

    expect(detection.value).toBe("user@domain.com");
  });

  it("documents the known false positive logo@2x.png", () => {
    const result = emailDetector.detect("Image file: logo@2x.png");

    expect(result.map(({ value }) => value)).toEqual(["logo@2x.png"]);
  });

  it("excludes trailing punctuation from detected email values", () => {
    const result = emailDetector.detect("Contact a@b.com. Or a@b.com,");

    expect(result.map(({ value }) => value)).toEqual([
      "a@b.com",
      "a@b.com",
    ]);
  });

  it("supports case, plus-addressing, subdomains, and empty input", () => {
    expect(
      emailDetector.detect("USER@Example.COM").map(({ value }) => value),
    ).toEqual(["USER@Example.COM"]);
    expect(
      emailDetector.detect("a+tag@b.co.uk").map(({ value }) => value),
    ).toEqual(["a+tag@b.co.uk"]);
    expect(emailDetector.detect("")).toEqual([]);
  });
});
