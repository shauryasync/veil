import { jwtDetector } from "../src/detectors/jwt.js";
import { it, describe, expect } from "vitest";
describe("JWT Detector (Phase 2.2)", () => {
  const validJwt1 =
    "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJl";
  const validJwt2 = "eyJhbGci.eyJwYXlsb2Fk.c2lnbmF0dXJl_123-abc";

  it("detects a synthetic JWT-shaped string embedded in ordinary text", () => {
    const text = `Authorization: ${validJwt1} for the current session.`;
    const results = jwtDetector.detect(text);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      type: "JWT",
      value: validJwt1,
      start: 15,
      end: 15 + validJwt1.length,
      confidence: 1,
    });

    const detection = results[0];
    if (detection === undefined) {
      throw new Error("Expected the JWT detector to return one detection");
    }

    expect(text.slice(detection.start, detection.end)).toBe(detection.value);
  });

  it("detects multiple candidates in one input", () => {
    const text = `Old token: ${validJwt1}\nNew token: ${validJwt2}`;
    const results = jwtDetector.detect(text);

    expect(results).toHaveLength(2);
    const first = results[0];
    const second = results[1];
    if (first === undefined || second === undefined) {
      throw new Error("Expected the JWT detector to return two detections");
    }

    expect(first.value).toBe(validJwt1);
    expect(second.value).toBe(validJwt2);
  });

  describe("Malformed shapes (should not detect)", () => {
    it("ignores tokens missing a segment (only one dot)", () => {
      const twoSegments = "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const text = `Token: ${twoSegments}`;
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });

    it("ignores tokens with too many separators (three or more dots)", () => {
      const fourSegments = `${validJwt2}.ZXh0cmE`;
      const text = `Token: ${fourSegments}`;
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });

    it("ignores tokens with characters outside Base64URL (+, /, =)", () => {
      const invalidChars = "eyJhbGci.eyJzdWIi.SflKxw+invalid/chars=";
      const text = `Token: ${invalidChars}`;
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });
  });

  describe("False positives (should not detect)", () => {
    it("ignores ordinary dotted version strings", () => {
      const text =
        "The application was updated to v14.15.4 or maybe 2.0.0 today.";
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });

    it("ignores hostnames with dots", () => {
      const text = "Please connect to api.production.domain.com for access.";
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });

    it("ignores two-segment token-like strings", () => {
      const text = "Use the format user_name.session_id for the legacy API.";
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });
  });

  describe("Boundaries", () => {
    it("does not extract a JWT-shaped substring from a longer dotted sequence", () => {
      const text = `header.eyJhbGci.eyJwYXlsb2Fk.c2lnbmF0dXJl`;
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });

    it("does not extract if attached to other word characters", () => {
      const text = `prefix_${validJwt1}_suffix`;
      expect(jwtDetector.detect(text)).toHaveLength(0);
    });
  });
});
