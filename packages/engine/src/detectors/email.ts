import type { Detection, Detector } from "../types.js";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export const emailDetector: Detector = {
  name: "email",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];
    let matches = text.matchAll(EMAIL_REGEX);

    for (const match of matches) {
      const value = match[0];

      detections.push({
        type: "EMAIL",
        start: match.index,
        end: match.index + value.length,
        value: value,
        confidence: 1.0,
      });
    }
    return detections;
  },
};
