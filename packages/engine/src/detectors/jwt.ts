import type { Detection, Detector } from "../types.js";

const JWT_REGEX =
  /(?<![A-Za-z0-9_.+/=-])(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(?![A-Za-z0-9_.+/=-])/g;

export const jwtDetector: Detector = {
  name: "jwt",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(JWT_REGEX)) {
      const value = match[0];
      detections.push({
        type: "JWT",
        value,
        start: match.index,
        end: match.index + value.length,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
