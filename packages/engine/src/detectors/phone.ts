import type { Detection, Detector } from "../types.js";

const PHONE_REGEX =
  /(?<![\d+])(?:\+91[\s-]?[6-9]\d{9}|\+[1-9]\d{7,14}|[6-9]\d{9})(?!\d)/g;

export const phoneDetector: Detector = {
  name: "phone",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    const matches = text.matchAll(PHONE_REGEX);

    for (const match of matches) {
      const value = match[0];

      detections.push({
        type: "PHONE_NUMBER",
        start: match.index,
        end: match.index + value.length,
        value: value,
        confidence: 1.0,
      });
    }
    return detections;
  },
};
