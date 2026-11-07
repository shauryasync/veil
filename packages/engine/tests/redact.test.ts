import { redact } from "../src/redact.js";
import { it, describe, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";
import { SessionMapping } from "../src/mapping.js";
import type { Detector } from "../src/types.js";

describe("Redact_Test", () => {
  it("keeps text unchanged when no detection happens", () => {
    const text = "Nothing sensitive here.";
    const result = redact(text, [emailDetector]);
    expect(result.redactedText).toBe(text);
  });

  it("replaces one span on one detection", () => {
    const text = "Contact alex@gmail.com for more info about the store.";
    const result = redact(text, [emailDetector]);
    expect(result.redactedText).toBe(
      "Contact [[VEIL:EMAIL_1]] for more info about the store.",
    );
  });

  it("replaces all spans when there are multiple detections", () => {
    const text =
      "Contact alex@gmail.com for more info about the store. alex@gmail.com was earlier alex00@gmail.com.";
    const result = redact(text, [emailDetector]);
    expect(result.redactedText).toBe(
      "Contact [[VEIL:EMAIL_1]] for more info about the store. [[VEIL:EMAIL_1]] was earlier [[VEIL:EMAIL_2]].",
    );
    for (const detection of result.detections) {
      expect(text.slice(detection.start, detection.end)).toBe(detection.value);
    }
  });

  it("reuses placeholders across calls when given the same session mapping", () => {
    const sessionMapping = new SessionMapping();
    const first = redact("Contact alex@gmail.com", [emailDetector], sessionMapping);
    const second = redact("Email alex@gmail.com again", [emailDetector], sessionMapping);

    expect(first.redactedText).toBe("Contact [[VEIL:EMAIL_1]]");
    expect(second.redactedText).toBe("Email [[VEIL:EMAIL_1]] again");
    expect(second.mapping).toEqual({
      "[[VEIL:EMAIL_1]]": "alex@gmail.com",
    });
  });

  it("does not include the original sensitive value in redacted text", () => {
    const sensitiveValue = "private.person@example.com";
    const result = redact(`Contact ${sensitiveValue}`, [emailDetector]);

    expect(result.redactedText).not.toContain(sensitiveValue);
  });

  it("redacts an email address found inside a URL path", () => {
    const text = "Visit https://api.site.com/v1/user@domain.com/profile";
    const result = redact(text, [emailDetector]);

    expect(result.redactedText).toBe(
      "Visit https://api.site.com/v1/[[VEIL:EMAIL_1]]/profile",
    );
    expect(result.mapping).toEqual({
      "[[VEIL:EMAIL_1]]": "user@domain.com",
    });
  });

  it("resolves overlapping detections by keeping the longest span", () => {
    const text = "call alice@example.com now";
    const detectors: Detector[] = [
      {
        name: "outer",
        detect: () => [
          {
            type: "EMAIL",
            start: 5,
            end: 22,
            value: "alice@example.com",
            confidence: 1,
          },
        ],
      },
      {
        name: "inner",
        detect: () => [
          {
            type: "EMAIL",
            start: 11,
            end: 18,
            value: "example",
            confidence: 0.9,
          },
        ],
      },
    ];

    const result = redact(text, detectors);

    expect(result.redactedText).toBe("call [[VEIL:EMAIL_1]] now");
    expect(result.mapping).toEqual({
      "[[VEIL:EMAIL_1]]": "alice@example.com",
    });
  });

  it("uses the earlier start when overlapping detections have equal lengths", () => {
    const detectors: Detector[] = [
      {
        name: "earlier",
        detect: () => [
          {
            type: "EMAIL",
            start: 1,
            end: 5,
            value: "bcde",
            confidence: 1,
          },
        ],
      },
      {
        name: "later",
        detect: () => [
          {
            type: "API_KEY",
            start: 3,
            end: 7,
            value: "defg",
            confidence: 1,
          },
        ],
      },
    ];

    const result = redact("abcdefg", detectors);

    expect(result.redactedText).toBe("a[[VEIL:EMAIL_1]]fg");
    expect(result.detections).toHaveLength(1);
    expect(result.mapping).toEqual({ "[[VEIL:EMAIL_1]]": "bcde" });
  });

  it("uses detector order when overlapping detections have the same span", () => {
    const detectors: Detector[] = [
      {
        name: "first",
        detect: () => [
          {
            type: "API_KEY",
            start: 1,
            end: 4,
            value: "bcd",
            confidence: 1,
          },
        ],
      },
      {
        name: "second",
        detect: () => [
          {
            type: "EMAIL",
            start: 1,
            end: 4,
            value: "bcd",
            confidence: 1,
          },
        ],
      },
    ];

    const result = redact("abcde", detectors);

    expect(result.redactedText).toBe("a[[VEIL:API_KEY_1]]e");
    expect(result.detections).toHaveLength(1);
    expect(result.mapping).toEqual({ "[[VEIL:API_KEY_1]]": "bcd" });
  });

  it("keeps adjacent detections because they do not overlap", () => {
    const detectors: Detector[] = [
      {
        name: "left",
        detect: () => [
          {
            type: "EMAIL",
            start: 0,
            end: 2,
            value: "ab",
            confidence: 1,
          },
        ],
      },
      {
        name: "right",
        detect: () => [
          {
            type: "API_KEY",
            start: 2,
            end: 4,
            value: "cd",
            confidence: 1,
          },
        ],
      },
    ];

    const result = redact("abcdef", detectors);

    expect(result.redactedText).toBe(
      "[[VEIL:EMAIL_1]][[VEIL:API_KEY_1]]ef",
    );
    expect(result.detections).toHaveLength(2);
    expect(result.mapping).toEqual({
      "[[VEIL:EMAIL_1]]": "ab",
      "[[VEIL:API_KEY_1]]": "cd",
    });
  });
});
