import { redact } from "../src/redact.js";
import { it, describe, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";
import { SessionMapping } from "../src/mapping.js";
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
});
