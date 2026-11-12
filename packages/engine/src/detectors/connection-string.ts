import type { Detection, Detector } from "../types.js";

const CONNECTION_STRING_REGEX =
  /(?<![A-Za-z0-9+.-])((?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|mariadb|redis|rediss|sqlserver):\/\/[^:/?#\s"'<>@]+:[^@/?#\s"'<>]+@(?:\[[^\]\s"'<>]+\]|[^:/?#\s"'<>]+)(?::\d+)?(?:\/[^\s"'<>]*)?)(?![A-Za-z0-9/?#])/gi;

export const connectionStringDetector: Detector = {
  name: "connection-string",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(CONNECTION_STRING_REGEX)) {
      let value = match[0];
      let end = match.index + value.length;

      while (/[.,;!)}\]]$/.test(value)) {
        value = value.slice(0, -1);
        end -= 1;
      }

      if (value.length === 0) {
        continue;
      }

      detections.push({
        type: "CONNECTION_STRING",
        value,
        start: match.index,
        end,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
