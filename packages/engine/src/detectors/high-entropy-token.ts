import type { Detection, Detector } from "../types.js";

const MIN_TOKEN_LENGTH = 20;
const MIN_ENTROPY_BITS_PER_CHARACTER = 3.5;
const TOKEN_REGEX =
  /(?<![A-Za-z0-9_+/-])([A-Za-z0-9_+/-]{20,}={0,2})(?![A-Za-z0-9_+/=-])/g;
const UUID_REGEX = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const HASH_LENGTHS = new Set([32, 40, 56, 64, 96, 128]);

function calculateEntropy(value: string): number {
  const frequencies = new Map<string, number>();
  for (const character of value) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function isUuidOrHash(value: string): boolean {
  if (UUID_REGEX.test(value)) {
    return true;
  }

  return HASH_LENGTHS.has(value.length) && /^[0-9a-f]+$/i.test(value);
}

export const highEntropyTokenDetector: Detector = {
  name: "high-entropy-token",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(TOKEN_REGEX)) {
      const value = match[1];
      if (value === undefined) {
        continue;
      }

      if (
        value.length < MIN_TOKEN_LENGTH ||
        isUuidOrHash(value) ||
        calculateEntropy(value) < MIN_ENTROPY_BITS_PER_CHARACTER
      ) {
        continue;
      }

      detections.push({
        type: "HIGH_ENTROPY_TOKEN",
        value,
        start: match.index,
        end: match.index + value.length,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
