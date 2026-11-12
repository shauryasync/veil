import { awsAccessKeyDetector } from "../src/detectors/aws-access-key.js";
import { it, describe, expect } from "vitest";
describe("AWS Access Key ID Detector (Phase 2.3)", () => {
  const fakeAkia = "AKIAIOSFODNN7EXAMPLE";
  const fakeAsia = "ASIAFAKEEXAMPLE12345";

  it("detects a supported key ID embedded in text", () => {
    const text = `Key: ${fakeAkia} for deployment.`;
    const results = awsAccessKeyDetector.detect(text);

    expect(results).toHaveLength(1);
    const result = results[0];
    if (result === undefined) {
      throw new Error("Expected an AWS access key detection");
    }

    expect(result).toEqual({
      type: "AWS_ACCESS_KEY",
      value: fakeAkia,
      start: 5,
      end: 25,
      confidence: 1,
    });

    expect(text.slice(result.start, result.end)).toBe(result.value);
  });

  it("detects multiple IDs in one input, including different prefixes", () => {
    const text = `Primary: ${fakeAkia}\nSession: ${fakeAsia}`;
    const results = awsAccessKeyDetector.detect(text);

    expect(results).toHaveLength(2);
    const [first, second] = results;
    if (first === undefined || second === undefined) {
      throw new Error("Expected two AWS access key detections");
    }
    expect(first.value).toBe(fakeAkia);
    expect(second.value).toBe(fakeAsia);
  });

  describe("Malformed shapes (should not detect)", () => {
    it("ignores keys that are too short", () => {
      const tooShort = "AKIAIOSFODNN7EXAMPL";
      expect(awsAccessKeyDetector.detect(`Key: ${tooShort}`)).toHaveLength(0);
    });

    it("ignores keys that are too long", () => {
      const tooLong = "AKIAIOSFODNN7EXAMPLEE";
      expect(awsAccessKeyDetector.detect(`Key: ${tooLong}`)).toHaveLength(0);
    });

    it("ignores keys with invalid characters (lowercase/symbols)", () => {
      const lowerCase = "AKIAiosfodnn7example";
      const symbols = "AKIAIOSFOD-N7EXAMPLE";
      expect(awsAccessKeyDetector.detect(`Key: ${lowerCase}`)).toHaveLength(0);
      expect(awsAccessKeyDetector.detect(`Key: ${symbols}`)).toHaveLength(0);
    });
  });

  describe("False positives (should not detect)", () => {
    it("ignores 20-character uppercase strings with unrecognized prefixes", () => {
      const wrongPrefix = "FAKEIOSFODNN7EXAMPLE";
      expect(awsAccessKeyDetector.detect(`Token: ${wrongPrefix}`)).toHaveLength(
        0,
      );
    });

    it("ignores standard UUIDs", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(awsAccessKeyDetector.detect(`ID: ${uuid}`)).toHaveLength(0);
    });

    it("ignores random 20-digit numeric sequences", () => {
      const numbersOnly = "12345678901234567890";
      expect(awsAccessKeyDetector.detect(`ID: ${numbersOnly}`)).toHaveLength(0);
    });
  });

  describe("Boundaries", () => {
    it("does not extract a key-like substring from a longer identifier", () => {
      const prefixAttached = `USER_${fakeAkia}`;
      const suffixAttached = `${fakeAkia}_SUFFIX`;

      expect(awsAccessKeyDetector.detect(prefixAttached)).toHaveLength(0);
      expect(awsAccessKeyDetector.detect(suffixAttached)).toHaveLength(0);
    });

    it("detects keys safely wrapped in quotes or brackets", () => {
      const text = `{"accessKeyId": "${fakeAkia}"}`;
      const results = awsAccessKeyDetector.detect(text);
      expect(results).toHaveLength(1);
      const result = results[0];
      if (result === undefined) {
        throw new Error("Expected an AWS access key detection");
      }
      expect(result.value).toBe(fakeAkia);
    });
  });
});
