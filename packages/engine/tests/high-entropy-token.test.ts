import { describe, expect, it } from "vitest";
import { highEntropyTokenDetector } from "../src/detectors/high-entropy-token.js";
import { redact } from "../src/redact.js";

describe("High-entropy token detector", () => {
  it("detects a long, varied token and reports its exact span", () => {
    const token = "A7fK2mQ9xP4vB8nR6zW3";
    const text = `token=${token};`;
    const result = highEntropyTokenDetector.detect(text)[0];

    expect(result).toEqual({
      type: "HIGH_ENTROPY_TOKEN",
      value: token,
      start: text.indexOf(token),
      end: text.indexOf(token) + token.length,
      confidence: 1,
    });
    expect(text.slice(result?.start, result?.end)).toBe(token);
  });

  it("detects multiple tokens without including adjacent punctuation", () => {
    const first = "aB3dE5gH7jK9mN2pQ4rT6";
    const second = "xY8zA2bC5dE7fG1hJ4kL9";
    const text = `(${first}), then ${second}.`;

    expect(
      highEntropyTokenDetector.detect(text).map(({ value }) => value),
    ).toEqual([first, second]);
  });

  it("ignores candidates shorter than the minimum length", () => {
    expect(
      highEntropyTokenDetector.detect("short=A7fK2mQ9xP4vB8nR6z"),
    ).toHaveLength(0);
  });

  it("redacts a detected token through the default registry", () => {
    const token = "A7fK2mQ9xP4vB8nR6zW3";
    const result = redact(token);

    expect(result.redactedText).toBe("[[VEIL:HIGH_ENTROPY_TOKEN_1]]");
    expect(result.detections.map(({ type }) => type)).toEqual([
      "HIGH_ENTROPY_TOKEN",
    ]);
  });

  describe("false positives", () => {
    it("ignores repeated low-variety strings", () => {
      expect(
        highEntropyTokenDetector.detect("token=abcabcabcabcabcabcabc"),
      ).toHaveLength(0);
    });

    it("ignores UUIDs", () => {
      expect(
        highEntropyTokenDetector.detect(
          "id=550e8400-e29b-41d4-a716-446655440000",
        ),
      ).toHaveLength(0);
    });

    it("ignores common hexadecimal hash lengths", () => {
      const hashes = [
        "0123456789abcdef0123456789abcdef",
        "0123456789abcdef0123456789abcdef01234567",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      ];

      expect(
        highEntropyTokenDetector.detect(hashes.join("\n")),
      ).toHaveLength(0);
    });
  });
});
