import { describe, expect, it } from "vitest";
import { SessionMapping } from "../src/mapping.js";

describe("SessionMapping", () => {
  it("reuses a placeholder when the same value is seen again", () => {
    const mapping = new SessionMapping();

    const first = mapping.getOrWritePlaceholder("alex@example.com", "EMAIL");
    const second = mapping.getOrWritePlaceholder("alex@example.com", "EMAIL");

    expect(first).toBe("[[VEIL:EMAIL_1]]");
    expect(second).toBe(first);
    expect(mapping.getMapping()).toEqual({
      "[[VEIL:EMAIL_1]]": "alex@example.com",
    });
  });

  it("assigns different placeholders to different values of the same type", () => {
    const mapping = new SessionMapping();

    const first = mapping.getOrWritePlaceholder("alex@example.com", "EMAIL");
    const second = mapping.getOrWritePlaceholder("sam@example.com", "EMAIL");

    expect(first).toBe("[[VEIL:EMAIL_1]]");
    expect(second).toBe("[[VEIL:EMAIL_2]]");
  });
});
