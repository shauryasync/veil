import { describe, expect, it } from "vitest";
import { SessionMapping } from "../src/mapping.js";

describe("SessionMapping", () => {
  it("reuses a placeholder when the same value is seen again", () => {
    const mapping = new SessionMapping();

    const first = mapping.getOrCreatePlaceholder("alex@example.com", "EMAIL");
    const second = mapping.getOrCreatePlaceholder("alex@example.com", "EMAIL");

    expect(first).toBe("[[VEIL:EMAIL_1]]");
    expect(second).toBe(first);
    expect(mapping.getMapping()).toEqual({
      "[[VEIL:EMAIL_1]]": "alex@example.com",
    });
  });

  it("assigns different placeholders to different values of the same type", () => {
    const mapping = new SessionMapping();

    const first = mapping.getOrCreatePlaceholder("alex@example.com", "EMAIL");
    const second = mapping.getOrCreatePlaceholder("sam@example.com", "EMAIL");

    expect(first).toBe("[[VEIL:EMAIL_1]]");
    expect(second).toBe("[[VEIL:EMAIL_2]]");
  });

  it("keeps counters independent for different types", () => {
    const mapping = new SessionMapping();

    const firstEmail = mapping.getOrCreatePlaceholder("alex@example.com", "EMAIL");
    const phone = mapping.getOrCreatePlaceholder("+1-555-0100", "PHONE_NUMBER");
    const secondEmail = mapping.getOrCreatePlaceholder("sam@example.com", "EMAIL");

    expect(firstEmail).toBe("[[VEIL:EMAIL_1]]");
    expect(phone).toBe("[[VEIL:PHONE_NUMBER_1]]");
    expect(secondEmail).toBe("[[VEIL:EMAIL_2]]");
    expect(mapping.getMapping()).toEqual({
      "[[VEIL:EMAIL_1]]": "alex@example.com",
      "[[VEIL:PHONE_NUMBER_1]]": "+1-555-0100",
      "[[VEIL:EMAIL_2]]": "sam@example.com",
    });
  });

  it("treats values with different casing as distinct", () => {
    const mapping = new SessionMapping();

    const first = mapping.getOrCreatePlaceholder("Foo@x.com", "EMAIL");
    const second = mapping.getOrCreatePlaceholder("foo@x.com", "EMAIL");

    expect(first).toBe("[[VEIL:EMAIL_1]]");
    expect(second).toBe("[[VEIL:EMAIL_2]]");
    expect(mapping.getMapping()).toEqual({
      "[[VEIL:EMAIL_1]]": "Foo@x.com",
      "[[VEIL:EMAIL_2]]": "foo@x.com",
    });
  });
});
