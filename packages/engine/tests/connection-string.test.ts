import { describe, expect, it } from "vitest";
import { connectionStringDetector } from "../src/detectors/connection-string.js";

describe("Database connection string detector", () => {
  it("detects a MongoDB URI with credentials and preserves its exact span", () => {
    const value =
      "mongodb+srv://veil_user:fake%40pass@cluster.example.test/app?retryWrites=true";
    const text = `DATABASE_URL=${value}`;
    const result = connectionStringDetector.detect(text)[0];

    expect(result).toEqual({
      type: "CONNECTION_STRING",
      value,
      start: text.indexOf(value),
      end: text.indexOf(value) + value.length,
      confidence: 1,
    });
    expect(text.slice(result?.start, result?.end)).toBe(value);
  });

  it("detects supported database schemes", () => {
    const values = [
      "postgres://veil_user:fakepass@db.example.test:5432/app",
      "postgresql://veil_user:fakepass@db.example.test/app",
      "mysql://veil_user:fakepass@db.example.test:3306/app",
      "mariadb://veil_user:fakepass@db.example.test/app",
      "redis://veil_user:fakepass@cache.example.test:6379/0",
      "rediss://veil_user:fakepass@cache.example.test:6380/0",
      "sqlserver://veil_user:fakepass@db.example.test:1433/app",
      "mongodb://veil_user:fakepass@db.example.test:27017/app",
    ];

    expect(
      connectionStringDetector.detect(values.join("\n")).map(({ value }) => value),
    ).toEqual(values);
  });

  it("does not include sentence punctuation in the detection span", () => {
    const value = "postgres://veil_user:fakepass@db.example.test/app";
    const text = `Use ${value}, then restart.`;
    const result = connectionStringDetector.detect(text)[0];

    expect(result?.value).toBe(value);
    expect(result?.end).toBe(text.indexOf(value) + value.length);
  });

  describe("false positives", () => {
    it("does not detect ordinary web URLs", () => {
      const text = "Visit https://example.test/path?user=name&token=sample.";
      expect(connectionStringDetector.detect(text)).toHaveLength(0);
    });

    it("does not detect database URLs without username and password credentials", () => {
      const text = [
        "postgres://db.example.test/app",
        "mongodb://db.example.test/app",
        "redis://cache.example.test:6379",
      ].join("\n");
      expect(connectionStringDetector.detect(text)).toHaveLength(0);
    });

    it("does not accept an empty username, password, or host", () => {
      const text = [
        "postgres://:fakepass@db.example.test/app",
        "postgres://veil_user:@db.example.test/app",
        "postgres://veil_user:fakepass@/app",
      ].join("\n");
      expect(connectionStringDetector.detect(text)).toHaveLength(0);
    });

    it("does not extract a connection URI when its scheme is embedded in a token", () => {
      const value = "postgres://veil_user:fakepass@db.example.test/app";
      expect(connectionStringDetector.detect(`prefix${value}`)).toHaveLength(0);
    });
  });
});
