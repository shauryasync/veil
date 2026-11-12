import type { Detection, Detector, RedactResult } from "./types.js";
import { SessionMapping } from "./mapping.js";
import { defaultDetectors } from "./default-detectors.js";

export function redact(
  text: string,
  detectors: readonly Detector[] = defaultDetectors,
  sessionMapping = new SessionMapping(),
): RedactResult {
  const detections: Detection[] = [];

  function findLiteralPlaceholders(text: string): Detection[] {
    const detections: Detection[] = [];
    const placeholderPattern =
      /\[\[VEIL:[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_\d+\]\]/g;

    for (const match of text.matchAll(placeholderPattern)) {
      const value = match[0];

      detections.push({
        type: "LITERAL",
        start: match.index,
        end: match.index + value.length,
        value: value,
        confidence: 1.0,
      });
    }

    return detections;
  }
  detections.push(...findLiteralPlaceholders(text));

  for (const detector of detectors) {
    detections.push(...detector.detect(text));
  }

  type Candidate = {
    detection: Detection;
    originalOrder: number;
  };

  const candidates: Candidate[] = detections.map(
    (detection, originalOrder) => ({
      detection,
      originalOrder,
    }),
  );

  candidates.sort((a, b) => {
    const isLiteralA = a.detection.type === "LITERAL" ? 1 : 0;
    const isLiteralB = b.detection.type === "LITERAL" ? 1 : 0;
    if (isLiteralA !== isLiteralB) return isLiteralB - isLiteralA;
    const lenA = a.detection.end - a.detection.start;
    const lenB = b.detection.end - b.detection.start;

    if (lenB !== lenA) return lenB - lenA;
    if (a.detection.start !== b.detection.start)
      return a.detection.start - b.detection.start;
    return a.originalOrder - b.originalOrder;
  });

  const prioritizedCandidates = [...candidates];

  const selectedCandidates: Candidate[] = [];
  for (const cand of prioritizedCandidates) {
    const { start, end } = cand.detection;
    const hasOverlap = selectedCandidates.some(
      ({ detection: sel }) => start < sel.end && sel.start < end,
    );

    if (!hasOverlap) {
      selectedCandidates.push(cand);
    }
  }

  const selectedInTextOrder = [...selectedCandidates].sort(
    (a, b) =>
      a.detection.start - b.detection.start ||
      a.originalOrder - b.originalOrder,
  );

  const replacements = selectedInTextOrder
    .map(({ detection }) => ({
      detection,
      placeholder: sessionMapping.getOrCreatePlaceholder(
        detection.value,
        detection.type,
      ),
    }))
    .sort((a, b) => b.detection.start - a.detection.start);

  let redactedText = text;

  for (const { detection, placeholder } of replacements) {
    redactedText =
      redactedText.slice(0, detection.start) +
      placeholder +
      redactedText.slice(detection.end);
  }

  return {
    redactedText,
    detections: selectedInTextOrder.map(({ detection }) => detection),
    mapping: sessionMapping.getMapping(),
  };
}
