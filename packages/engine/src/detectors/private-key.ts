import type { Detection, Detector } from "../types.js";

const PRIVATE_KEY_REGEX =
  /^([ \t]*)-----BEGIN (RSA PRIVATE KEY|EC PRIVATE KEY|DSA PRIVATE KEY|PRIVATE KEY|ENCRYPTED PRIVATE KEY|OPENSSH PRIVATE KEY)-----[ \t]*\r?\n(?:[A-Za-z0-9+/]+={0,2}\r?\n)+[ \t]*-----END \2-----[ \t]*(?=\r?$)/gm;

export const privateKeyDetector: Detector = {
  name: "private-key",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(PRIVATE_KEY_REGEX)) {
      const indentation = match[1];
      if (indentation === undefined) {
        throw new Error("Private-key pattern did not capture line indentation");
      }

      const value = match[0].slice(indentation.length);
      const start = match.index + indentation.length;

      detections.push({
        type: "PRIVATE_KEY",
        value,
        start,
        end: start + value.length,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
