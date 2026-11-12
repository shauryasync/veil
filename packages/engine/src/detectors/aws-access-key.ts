import type { Detection, Detector } from "../types.js";

const AWS_ACCESS_KEY_REGEX =
  /(?<![A-Za-z0-9_])(?:AKIA|ASIA)[A-Z0-9]{16}(?![A-Za-z0-9_])/g;

export const awsAccessKeyDetector: Detector = {
  name: "aws-access-key",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(AWS_ACCESS_KEY_REGEX)) {
      const value = match[0];
      detections.push({
        type: "AWS_ACCESS_KEY",
        value,
        start: match.index,
        end: match.index + value.length,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
