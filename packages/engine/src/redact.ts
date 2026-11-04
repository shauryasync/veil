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

  for (const detection of detections) {
    sessionMapping.getOrWritePlaceholder(detection.value, detection.type);
  }

  //sort descending to prevent index drift
  const sortedDetections = [...detections].sort((a, b) => b.start - a.start);

  //backward string replacement
  let redactedText = text;
  for (const detection of sortedDetections) {
    const placeholder = sessionMapping.getPlaceholder(detection.value);
    if (placeholder === undefined) {
      throw new Error("Missing placeholder for detected value");
    }

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
