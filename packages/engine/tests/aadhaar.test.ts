import { describe, expect, it } from "vitest";
import { aadhaarDetector } from "../src/detectors/aadhaar.js";

describe("aadhaarDetector", () => {
  it("detects a synthetic checksum-valid Aadhaar number embedded in text", () => {
    const input = "Customer record: Aadhaar number 584920176341 confirmed.";
    const result = aadhaarDetector.detect(input);

    expect(result).toEqual([
      {
        type: "AADHAAR",
        start: 32,
        end: 44,
        value: "584920176341",
        confidence: 1.0,
      },
    ]);

    const detection = result[0];
    if (detection === undefined) {
      throw new Error("Expected the Aadhaar detector to return one detection");
    }

    expect(input.slice(detection.start, detection.end)).toBe(detection.value);
  });

  it("rejects a 12-digit number with an invalid Verhoeff checksum", () => {
    expect(aadhaarDetector.detect("584920176340")).toEqual([]);
  });

  it("rejects values with fewer or more than 12 digits", () => {
    expect(aadhaarDetector.detect("58492017634")).toEqual([]);
    expect(aadhaarDetector.detect("5849201763412")).toEqual([]);
  });

  it("rejects Aadhaar-shaped numbers beginning with 0 or 1", () => {
    expect(aadhaarDetector.detect("123456789010")).toEqual([]);
    expect(aadhaarDetector.detect("023456789012")).toEqual([]);
  });

  it("does not detect an Aadhaar-shaped sequence inside a longer identifier", () => {
    expect(aadhaarDetector.detect("X584920176341Y")).toEqual([]);
  });
});