import type { Detection, Detector } from "../types.js";

const PAN_REGEX =
  /(?<![A-Za-z0-9])[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z](?![A-Za-z0-9])/g;

export const panDetector: Detector = {
  name: "pan",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    const matches = text.matchAll(PAN_REGEX);

    for (const match of matches) {
      const value = match[0];

      detections.push({
        type: "PAN",
        start: match.index,
        end: match.index + value.length,
        value: value,
        confidence: 1.0,
      });
    }
    return detections;
  },
};
