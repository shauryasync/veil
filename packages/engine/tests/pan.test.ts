import { it, describe, expect } from "vitest";
import { panDetector } from "../src/detectors/pan.js";

describe("Pan Detector", () => {
  it("detects a PAN number embedded in text with accurate fields", () => {
    const input =
      "Customer onboarding details: The individual account PAN is ABCPE1234F.";
    const result = panDetector.detect(input);

    expect(result).toEqual([
      {
        type: "PAN",
        start: 59,
        end: 69,
        value: "ABCPE1234F",
        confidence: 1.0,
      },
    ]);
    const detection = result[0];
    if (detection === undefined) {
      throw new Error("Expected the PAN detector to return one detection");
    }

    expect(input.slice(detection.start, detection.end)).toBe("ABCPE1234F");
  });

  it("rejects a PAN with an invalid holder-category character", () => {
    expect(panDetector.detect("ABCDE1234F")).toEqual([]);
  });

  it("rejects a PAN with the wrong number of digits", () => {
    expect(panDetector.detect("ABCPE123F")).toEqual([]);
  });

  it("does not detect a PAN-shaped substring inside a longer identifier", () => {
    expect(panDetector.detect("XABCPE1234FY")).toEqual([]);
  });
});
