import type { Detection, Detector, RedactResult } from "./types.js";
import { SessionMapping } from "./mapping.js";

export function redact(
  text: string,
  detectors: Detector[],
  sessionMapping = new SessionMapping(),
): RedactResult {
  // 1. Gather all raw detections
  const detections: Detection[] = [];

  // TODO: Before regular detectors run, find placeholder-shaped text in the
  // original input and add one Detection per match with type "LITERAL".
  // Each detection's start/end/value must describe the exact matched text;
  // allow underscores in TYPE, as in [[VEIL:API_KEY_1]].
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

  // 2. Sort by Priority Rules (Length desc -> Start asc -> Order asc)
  candidates.sort((a, b) => {
    // TODO: Make LITERAL detections win over any overlapping non-LITERAL
    // detection. Then apply the existing length, start, and original-order
    // tie-breakers. Keep the priority explicit and deterministic.
    const isLiteralA = a.detection.type === "LITERAL" ? 1 : 0;
    const isLiteralB = b.detection.type === "LITERAL" ? 1 : 0;
    if (isLiteralA !== isLiteralB) return isLiteralB - isLiteralA;
    const lenA = a.detection.end - a.detection.start;
    const lenB = b.detection.end - b.detection.start;

    if (lenB !== lenA) return lenB - lenA; // 1. Longest span first
    if (a.detection.start !== b.detection.start)
      return a.detection.start - b.detection.start; // 2. Earliest start
    return a.originalOrder - b.originalOrder; // 3. Detector order tiebreaker
  });

  const prioritizedCandidates = [...candidates];

  // 3. Filter out overlapping spans
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

  // 4. Assign placeholders in text order so numbering follows first appearance
  const selectedInTextOrder = [...selectedCandidates].sort(
    (a, b) =>
      a.detection.start - b.detection.start ||
      a.originalOrder - b.originalOrder,
  );

  // 5. Create placeholders only for chosen matches, then order edits right-to-left
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

  // 6. Splice text from right to left
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
