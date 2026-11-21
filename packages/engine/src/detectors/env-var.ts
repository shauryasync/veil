import type { Detection, Detector } from "../types.js";
import { isHighEntropyToken } from "./high-entropy-token.js";

const ENV_ASSIGNMENT_REGEX =
  /^[ \t]*(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=[ \t]*(.*)$/gm;
const SENSITIVE_ENV_KEY_REGEX = /(?:KEY|SECRET|TOKEN|PASSWORD|URL)/i;

export const envVarDetector: Detector = {
  name: "env-var",
  detect(text: string): Detection[] {
    const detections: Detection[] = [];

    for (const match of text.matchAll(ENV_ASSIGNMENT_REGEX)) {
      const key = match[1];
      const rawValue = match[2];
      if (key === undefined || rawValue === undefined || rawValue.length === 0) {
        continue;
      }

      const valueStart = match.index + match[0].length - rawValue.length;
      const quote = rawValue[0];
      let start = valueStart;
      let end = valueStart + rawValue.length;

      if (quote === "'" || quote === '"') {
        let closingQuote = -1;
        let escaped = false;

        for (let index = 1; index < rawValue.length; index += 1) {
          const character = rawValue[index];
          if (character === undefined) {
            continue;
          }

          if (escaped) {
            escaped = false;
          } else if (character === "\\") {
            escaped = true;
          } else if (character === quote) {
            closingQuote = index;
            break;
          }
        }

        if (closingQuote < 0) {
          continue;
        }

        const trailingText = rawValue.slice(closingQuote + 1).trimStart();
        if (trailingText.length > 0 && !trailingText.startsWith("#")) {
          continue;
        }

        start += 1;
        end = valueStart + closingQuote;
      } else {
        let contentEnd = rawValue.length;
        const inlineComment = /\s+#/.exec(rawValue);
        if (inlineComment !== null) {
          contentEnd = inlineComment.index;
        }

        while (
          contentEnd > 0 &&
          (rawValue[contentEnd - 1] === " " ||
            rawValue[contentEnd - 1] === "\t")
        ) {
          contentEnd -= 1;
        }

        if (contentEnd === 0 || rawValue[0] === "#") {
          continue;
        }

        end = valueStart + contentEnd;
      }

      if (end <= start) {
        continue;
      }

      const value = text.slice(start, end);
      if (
        !SENSITIVE_ENV_KEY_REGEX.test(key) &&
        !isHighEntropyToken(value)
      ) {
        continue;
      }

      detections.push({
        type: "ENV_VAR",
        value,
        start,
        end,
        confidence: 1.0,
      });
    }

    return detections;
  },
};
