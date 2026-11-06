export class SessionMapping {
  private typeCounters = new Map<string, number>();
  private valueToPlaceholder = new Map<string, string>();
  private placeholderToValue = new Map<string, string>();

  getOrCreatePlaceholder(value: string, type: string): string {
    const existingPlaceholder = this.valueToPlaceholder.get(value);
    if (existingPlaceholder !== undefined) {
      return existingPlaceholder;
    }

    const normalizedType = type.toUpperCase();
    const currentCount = (this.typeCounters.get(normalizedType) ?? 0) + 1;
    this.typeCounters.set(normalizedType, currentCount);

    const placeholder = `[[VEIL:${normalizedType}_${currentCount}]]`;

    this.valueToPlaceholder.set(value, placeholder);
    this.placeholderToValue.set(placeholder, value);

    return placeholder;
  }

  getPlaceholder(value: string): string | undefined {
    return this.valueToPlaceholder.get(value);
  }

  getMapping(): Record<string, string> {
    return Object.fromEntries(this.placeholderToValue);
  }
}
