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
