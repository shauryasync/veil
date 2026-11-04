export class SessionMapping {
  private typeCounters = new Map<string, number>();
  private valueToPlaceholder = new Map<string, string>();
  private placeholderToValue = new Map<string, string>();

  getOrWritePlaceholder(value: string, type: string): string {
    const existingPlaceholder = this.valueToPlaceholder.get(value);
    if (existingPlaceholder !== undefined) {
      return existingPlaceholder;
    }

    const currentCount = (this.typeCounters.get(type) ?? 0) + 1;
    this.typeCounters.set(type, currentCount);

    const placeholder = `[[VEIL:${type.toUpperCase()}_${currentCount}]]`;

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
