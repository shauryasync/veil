import { describe, expect, it } from "vitest";
import corpus from "./fixtures/labeled-corpus.json" with { type: "json" };
import { defaultDetectors } from "../src/default-detectors.js";
import type { DetectionType } from "../src/types.js";

const detectorTypes: Record<string, DetectionType> = {
  email: "EMAIL",
  phone: "PHONE_NUMBER",
  pan: "PAN",
  aadhaar: "AADHAAR",
  jwt: "JWT",
  "aws-access-key": "AWS_ACCESS_KEY",
  "private-key": "PRIVATE_KEY",
  "connection-string": "CONNECTION_STRING",
  "env-var": "ENV_VAR",
  "high-entropy-token": "HIGH_ENTROPY_TOKEN",
};

function detectionKey(
  type: DetectionType,
  start: number,
  end: number,
  value: string,
): string {
  return JSON.stringify([type, start, end, value]);
}

function countKeys(keys: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatRate(numerator: number, denominator: number): string {
  return denominator === 0
    ? "N/A"
    : `${((numerator / denominator) * 100).toFixed(1)}%`;
}

describe("Detector corpus measurement", () => {
  it("prints precision and recall for every default detector", () => {
    const results = defaultDetectors.map((detector) => {
      const expectedType = detectorTypes[detector.name];
      if (expectedType === undefined) {
        throw new Error(`No corpus label type configured for ${detector.name}`);
      }

      let truePositives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;

      for (const sample of corpus.cases) {
        const expectedKeys = sample.expected
          .filter(({ type }) => type === expectedType)
          .map(({ value }) => {
            const start = sample.text.indexOf(value);
            if (start < 0 || sample.text.indexOf(value, start + 1) >= 0) {
              throw new Error(
                `Expected label in ${sample.id} must occur exactly once: ${value}`,
              );
            }
            return detectionKey(
              expectedType,
              start,
              start + value.length,
              value,
            );
          });
        const actualKeys = detector.detect(sample.text).map((detection) =>
          detectionKey(
            detection.type,
            detection.start,
            detection.end,
            detection.value,
          ),
        );
        const expected = countKeys(expectedKeys);
        const actual = countKeys(actualKeys);
        const keys = new Set([...expected.keys(), ...actual.keys()]);

        for (const key of keys) {
          const expectedCount = expected.get(key) ?? 0;
          const actualCount = actual.get(key) ?? 0;
          truePositives += Math.min(expectedCount, actualCount);
          falsePositives += Math.max(actualCount - expectedCount, 0);
          falseNegatives += Math.max(expectedCount - actualCount, 0);
        }
      }

      const precisionDenominator = truePositives + falsePositives;
      const recallDenominator = truePositives + falseNegatives;

      return {
        detector: detector.name,
        TP: truePositives,
        FP: falsePositives,
        FN: falseNegatives,
        precision: formatRate(truePositives, precisionDenominator),
        recall: formatRate(truePositives, recallDenominator),
      };
    });

    console.log(`Labeled corpus: ${corpus.cases.length} samples`);
    console.table(results);
    expect(results).toHaveLength(defaultDetectors.length);
  });
});
