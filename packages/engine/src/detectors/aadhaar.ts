import type { Detection, Detector } from "../types.js";

const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function validateVerhoeff(candidate: string): boolean {
  if (!/^\d+$/.test(candidate)) return false;

  let state = 0;

  for (let i = 0; i < candidate.length; i++) {
    const position = i;
    const digitCharacter = candidate[candidate.length - 1 - i];
    if (digitCharacter === undefined) return false;

    const digitValue = Number(digitCharacter);
    const permutationRow = p[position % 8];
    if (permutationRow === undefined) return false;

    const permutedDigit = permutationRow[digitValue];
    if (permutedDigit === undefined) return false;

    const multiplicationRow = d[state];
    if (multiplicationRow === undefined) return false;

    const nextState = multiplicationRow[permutedDigit];
    if (nextState === undefined) return false;

    state = nextState;
  }

  return state === 0;
}

const AADHAAR_REGEX = /(?<![A-Za-z0-9])[2-9]\d{11}(?![A-Za-z0-9])/g;

export const aadhaarDetector: Detector = {
  name: "aadhaar",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(AADHAAR_REGEX)) {
      const value = match[0];
      if (!validateVerhoeff(value)) continue;

      detections.push({
        type: "AADHAAR",
        start: match.index,
        end: match.index + value.length,
        value,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
