import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { emailDetector } from "../src/detectors/email.js";
import { redact } from "../src/redact.js";
import { restore } from "../src/restore.js";

const textCharacters = [
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.!?-_",
];
const tokenCharacters = [..."abcdefghijklmnopqrstuvwxyz0123456789"];

const fillerArbitrary = fc
  .array(fc.constantFrom(...textCharacters), {
    minLength: 1,
    maxLength: 20,
  })
  .map((characters) => characters.join(""));

const tokenArbitrary = fc
  .array(fc.constantFrom(...tokenCharacters), {
    minLength: 1,
    maxLength: 8,
  })
  .map((characters) => characters.join(""));

const emailArbitrary = fc
  .tuple(tokenArbitrary, tokenArbitrary)
  .map(([localPart, domain]) => `${localPart}@${domain}.com`);

const placeholderArbitrary = fc
  .tuple(fc.constantFrom("EMAIL", "API_KEY"), fc.integer({ min: 1, max: 9999 }))
  .map(([type, number]) => `[[VEIL:${type}_${number}]]`);

const inputArbitrary = fc
  .tuple(
    fillerArbitrary,
    emailArbitrary,
    placeholderArbitrary,
    fillerArbitrary,
    fc.boolean(),
  )
  .map(([prefix, email, placeholder, separator, emailFirst]) => {
    const pieces = emailFirst ? [email, placeholder] : [placeholder, email];
    return `${prefix} ${pieces[0]} ${separator} ${pieces[1]}`;
  });

describe("Engine Round-Trip Property Tests", () => {
  it("restores generated text containing filler, emails, and literal placeholders", () => {
    fc.assert(
      fc.property(inputArbitrary, (input) => {
        const result = redact(input, [emailDetector]);
        expect(restore(result.redactedText, result.mapping)).toBe(input);
      }),
    );
  });
});
