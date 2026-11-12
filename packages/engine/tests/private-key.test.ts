import { describe, expect, it } from "vitest";
import { privateKeyDetector } from "../src/detectors/private-key.js";

describe("Private key detector", () => {
  it("detects a complete PKCS#8 private key block", () => {
    const block =
      "-----BEGIN PRIVATE KEY-----\n" +
      "MIIEvgIBADANBgkqhkiG9w0BAQEFAASC\n" +
      "-----END PRIVATE KEY-----";
    const text = `Key:\n${block}\nKeep this text.`;
    const result = privateKeyDetector.detect(text)[0];

    expect(result).toEqual({
      type: "PRIVATE_KEY",
      value: block,
      start: text.indexOf(block),
      end: text.indexOf(block) + block.length,
      confidence: 1,
    });
    expect(text.slice(result?.start, result?.end)).toBe(block);
  });

  it("detects supported legacy and encrypted key labels", () => {
    const blocks = [
      "-----BEGIN RSA PRIVATE KEY-----\nQUJDREVGR0g=\n-----END RSA PRIVATE KEY-----",
      "-----BEGIN ENCRYPTED PRIVATE KEY-----\nQUJDREVGR0g=\n-----END ENCRYPTED PRIVATE KEY-----",
      "-----BEGIN OPENSSH PRIVATE KEY-----\nQUJDREVGR0g=\n-----END OPENSSH PRIVATE KEY-----",
    ];
    const text = blocks.join("\n");

    expect(privateKeyDetector.detect(text).map(({ value }) => value)).toEqual(
      blocks,
    );
  });

  it("detects a key block with CRLF line endings and indentation", () => {
    const block =
      "-----BEGIN EC PRIVATE KEY-----\r\nQUJDREVGR0g=\r\n-----END EC PRIVATE KEY-----";
    const text = `  ${block}\r\n`;
    const result = privateKeyDetector.detect(text)[0];

    expect(result?.value).toBe(block);
    expect(result?.start).toBe(2);
    expect(result?.end).toBe(2 + block.length);
  });

  describe("false positives", () => {
    it("does not detect public key or certificate blocks", () => {
      const text = [
        "-----BEGIN PUBLIC KEY-----",
        "QUJDREVGR0g=",
        "-----END PUBLIC KEY-----",
        "-----BEGIN CERTIFICATE-----",
        "QUJDREVGR0g=",
        "-----END CERTIFICATE-----",
      ].join("\n");

      expect(privateKeyDetector.detect(text)).toHaveLength(0);
    });

    it("does not detect a private-key header without a matching block", () => {
      const text = "-----BEGIN PRIVATE KEY-----\nnot-a-base64-body";
      expect(privateKeyDetector.detect(text)).toHaveLength(0);
    });

    it("does not detect mismatched labels or invalid body characters", () => {
      const mismatched =
        "-----BEGIN RSA PRIVATE KEY-----\nQUJDREVGR0g=\n-----END EC PRIVATE KEY-----";
      const invalidBody =
        "-----BEGIN PRIVATE KEY-----\nnot a key!\n-----END PRIVATE KEY-----";

      expect(
        privateKeyDetector.detect(`${mismatched}\n${invalidBody}`),
      ).toHaveLength(0);
    });
  });
});
