import type { Detection, Detector, RedactResult } from "./types.js";
import { SessionMapping } from "./mapping.js";

export function redact(
  text: string,
  detectors: Detector[],
  sessionMapping = new SessionMapping(),
): RedactResult {
  //gather detections from all detectors
  const detections: Detection[] = [];
  for (const detector of detectors) {
    detections.push(...detector.detect(text));
  }

  const replacements = detections
    .map((detection) => ({
      detection,
      placeholder: sessionMapping.getOrCreatePlaceholder(
        detection.value,
        detection.type,
      ),
    }))
    .sort((a, b) => b.detection.start - a.detection.start);

  //backward string replacement
  let redactedText = text;
  for (const { detection, placeholder } of replacements) {
    redactedText =
      redactedText.slice(0, detection.start) +
      placeholder +
      redactedText.slice(detection.end);
  }

  return {
    redactedText,
    detections,
    mapping: sessionMapping.getMapping(),
  };
}
