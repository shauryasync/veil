import { describe, it, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";
import { redact } from "../src/redact.js";
import { restore } from "../src/restore.js";

describe("Engine Round-Trip Tests", () => {
  it("restores exact original string", () => {
    const input = "Send log to user@domain.com and ops@domain.com";
    const result = redact(input, [emailDetector]);
    expect(restore(result.redactedText, result.mapping)).toBe(input);
  });

  it("leaves the placeholder in the restored string if has no corresponding value in mapping", () => {
    const mapping = { "[[VEIL:EMAIL_1]]": "alex@domain.com" };
    const redacted = "Contact [[VEIL:EMAIL_3]]";
    expect(restore(redacted, mapping)).toBe("Contact [[VEIL:EMAIL_3]]");
  });

  it("handles secrets containing $& and $1 special characters", () => {
    const mapping = { "[[VEIL:EMAIL_1]]": "user$&name@domain.com" };
    const redacted = "Contact [[VEIL:EMAIL_1]]";
    expect(restore(redacted, mapping)).toBe("Contact user$&name@domain.com");
  });

  it("restores multi-word placeholder types like API_KEY", () => {
    const mapping = { "[[VEIL:API_KEY_1]]": "sk_live_abc123" };
    const redacted = "Authorization: Bearer [[VEIL:API_KEY_1]]";
    expect(restore(redacted, mapping)).toBe(
      "Authorization: Bearer sk_live_abc123",
    );
  });

  it("preserves an existing literal placeholder while redacting a real email", () => {
    const input = "Literal [[VEIL:EMAIL_1]] plus real user@example.com";
    const result = redact(input, [emailDetector]);

    expect(restore(result.redactedText, result.mapping)).toBe(input);
  });
});
