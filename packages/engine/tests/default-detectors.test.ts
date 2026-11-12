import { describe, expect, it } from "vitest";
import { defaultDetectors } from "../src/default-detectors.js";
import { emailDetector } from "../src/detectors/email.js";
import { redact } from "../src/redact.js";

describe("default detectors", () => {
  it("exports the implemented detectors in a stable order", () => {
    expect(defaultDetectors.map(({ name }) => name)).toEqual([
      "email",
      "phone",
      "pan",
      "aadhaar",
      "jwt",
      "aws-access-key",
      "private-key",
      "connection-string",
      "env-var",
    ]);
  });

  it("redacts with the standard detector set when no list is provided", () => {
    const text = "Contact alice@example.com";
    const result = redact(text);

    expect(result.redactedText).toBe("Contact [[VEIL:EMAIL_1]]");
    expect(result.detections.map(({ type }) => type)).toEqual(["EMAIL"]);
  });

  it("uses the environment-variable detector by default", () => {
    const result = redact("API_TOKEN=synthetic-token");

    expect(result.redactedText).toBe("API_TOKEN=[[VEIL:ENV_VAR_1]]");
    expect(result.detections.map(({ type }) => type)).toEqual(["ENV_VAR"]);
  });

  it("allows callers to keep passing a custom detector list", () => {
    const text = "Contact alice@example.com and call 9876543210";
    const result = redact(text, [emailDetector]);

    expect(result.redactedText).toBe(
      "Contact [[VEIL:EMAIL_1]] and call 9876543210",
    );
    expect(result.detections.map(({ type }) => type)).toEqual(["EMAIL"]);
  });
});
