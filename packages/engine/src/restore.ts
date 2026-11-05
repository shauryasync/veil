export function restore(text: string, mapping: Record<string, string>): string {
  const placeholderPattern = /\[\[VEIL:[A-Z][A-Z0-9]*_\d+\]\]/g;

  return text.replace(
    placeholderPattern,
    (placeholder) => mapping[placeholder] ?? placeholder,
  );
}
