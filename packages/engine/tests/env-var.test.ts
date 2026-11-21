import { describe, expect, it } from "vitest";
import { envVarDetector } from "../src/detectors/env-var.js";
import { redact } from "../src/redact.js";

describe(".env value detector", () => {
  it("detects an unquoted value but not the key", () => {
    const text = "API_TOKEN=synthetic-secret-123";
    const result = envVarDetector.detect(text)[0];

    expect(result).toEqual({
      type: "ENV_VAR",
      value: "synthetic-secret-123",
      start: text.indexOf("synthetic-secret-123"),
      end: text.length,
      confidence: 1,
    });
  });

  it("supports export and whitespace around the assignment", () => {
    const text = "  export   API_TOKEN  =  synthetic-secret";
    const result = envVarDetector.detect(text)[0];

    expect(result?.value).toBe("synthetic-secret");
    expect(text.slice(result?.start, result?.end)).toBe("synthetic-secret");
  });

  it("detects quoted values while preserving quotes and inline comments", () => {
    const text = [
      'API_TOKEN="secret value # stays in value" # comment',
      "OTHER_TOKEN='another secret' # comment",
    ].join("\n");
    const results = envVarDetector.detect(text);

    expect(results.map(({ value }) => value)).toEqual([
      "secret value # stays in value",
      "another secret",
    ]);
  });

  it("excludes unquoted inline comments and trailing whitespace", () => {
    const text = "API_TOKEN=synthetic-secret   # comment";
    const result = envVarDetector.detect(text)[0];

    expect(result?.value).toBe("synthetic-secret");
    expect(text.slice(result?.start, result?.end)).toBe("synthetic-secret");
  });

  it("redacts values while keeping assignment keys and quote syntax", () => {
    const text = [
      "export API_TOKEN=synthetic-token",
      'DATABASE_PASSWORD="synthetic password" # keep comment',
    ].join("\n");
    const result = redact(text, [envVarDetector]);

    expect(result.redactedText).toBe(
      "export API_TOKEN=[[VEIL:ENV_VAR_1]]\n" +
        'DATABASE_PASSWORD="[[VEIL:ENV_VAR_2]]" # keep comment',
    );
    expect(result.detections.map(({ value }) => value)).toEqual([
      "synthetic-token",
      "synthetic password",
    ]);
  });

  it("ignores ordinary Python assignments instead of treating them as env vars", () => {
    const text = [
      "total = 1 + 2",
      'name = "Ada"',
      "is_ready = True",
      "items = [1, 2, 3]",
      'message = "hello"',
    ].join("\n");

    expect(envVarDetector.detect(text)).toEqual([]);
  });

  it("ignores ordinary configuration values such as PORT and APP_MODE", () => {
    const text = "PORT=3000\nAPP_MODE=production";

    expect(envVarDetector.detect(text)).toEqual([]);
  });

  it("detects a high-entropy value even when its key is not sensitive-looking", () => {
    const token = "A7fK2mQ9xP4vB8nR6zW3";
    const text = `BUILD_LABEL=${token}`;
    const result = envVarDetector.detect(text)[0];

    expect(result?.value).toBe(token);
    expect(text.slice(result?.start, result?.end)).toBe(token);
  });

  describe("false positives", () => {
    it("ignores comments and lines without an assignment", () => {
      const text = [
        "# API_TOKEN=not-a-value",
        "API_TOKEN",
        "this is not an environment assignment",
      ].join("\n");

      expect(envVarDetector.detect(text)).toHaveLength(0);
    });

    it("ignores empty values and comment-only values", () => {
      const text = ["EMPTY=", "EMPTY_SPACED=   ", "COMMENT=# not a value"].join(
        "\n",
      );

      expect(envVarDetector.detect(text)).toHaveLength(0);
    });

    it("ignores malformed or unterminated quoted assignments", () => {
      const text = [
        'BROKEN="unterminated secret',
        'BROKEN_SUFFIX="secret" unexpected',
        "INVALID-NAME=secret",
      ].join("\n");

      expect(envVarDetector.detect(text)).toHaveLength(0);
    });
  });
});
