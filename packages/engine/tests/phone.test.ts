import { it, describe, expect } from "vitest";
import { phoneDetector } from "../src/detectors/phone.js";

describe("phoneDetector", () => {
  it("detects an Indian phone number with accurate fields", () => {
    const input = "Contact +91 9044432123";
    const result = phoneDetector.detect(input);

    expect(result).toEqual([
      {
        type: "PHONE_NUMBER",
        start: 8,
        end: 22,
        value: "+91 9044432123",
        confidence: 1.0,
      },
    ]);
    const detection = result[0];
    if (detection === undefined) {
      throw new Error("Expected the phone detector to return one detection");
    }

    expect(input.slice(detection.start, detection.end)).toBe("+91 9044432123");
  });

  it("detects Indian local and international E.164 numbers", () => {
    const input = "Call 9044432123 or +14155552671";
    const result = phoneDetector.detect(input);

    expect(result.map(({ value }) => value)).toEqual([
      "9044432123",
      "+14155552671",
    ]);
  });

  it("does not detect order numbers, dates, or IP addresses as phone numbers", () => {
    const input = "Order 12345678, date 2026-11-09, server 192.168.1.10";

    expect(phoneDetector.detect(input)).toEqual([]);
  });
});
