import type { Detection, Detector, RedactResult } from "./types.js";

export function redact(text: string, detectors: Detector[]): RedactResult {
  //gather detections from all detectors
  const detections: Detection[] = [];
  for (const detector of detectors) {
    detections.push(...detector.detect(text));
  }

  //track counters and assign placeholder to values, Record is a TS utility
  const typeCounters: Record<string, number> = {};
  const valueToPlaceholder = new Map<string, string>();
  const mapping: Record<string, string> = {};

  for (const detection of detections) {
    if (!valueToPlaceholder.has(detection.value)) {
      const currentCount = (typeCounters[detection.type] || 0) + 1;
      typeCounters[detection.type] = currentCount;

      const placeholder = `[[VEIL:${detection.type.toUpperCase()}_${currentCount}]]`;
      //mapping value to placeholder for redact
      valueToPlaceholder.set(detection.value, placeholder);
      //mapping placeholder to value for restore
      mapping[placeholder] = detection.value;
    }
  }

  //sort descending to prevent index drift
  const sortedDetections = [...detections].sort((a, b) => b.start - a.start);

  //backward string replacement
  let redactedText = text;
  for (const detection of sortedDetections) {
    const placeholder = valueToPlaceholder.get(detection.value)!;
    redactedText =
      redactedText.slice(0, detection.start) +
      placeholder +
      redactedText.slice(detection.end);
  }

  return {
    redactedText,
    detections,
    mapping,
  };
}
