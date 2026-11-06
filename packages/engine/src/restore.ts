export function restore(text: string, mapping: Record<string, string>): string {
  //updated regex for accomodating placeholders like API_KEY
  const placeholderPattern = /\[\[VEIL:[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_\d+\]\]/g;

  return text.replace(
    placeholderPattern,
    (placeholder) => mapping[placeholder] ?? placeholder,
  );
}
