import type { Language } from "../../../api/Language.ts"
import type Random from "../../../utils/random.ts"

export const supportedBases = [2, 8, 10, 16] as const
export type SupportedBase = (typeof supportedBases)[number]

const baseDigits: Record<SupportedBase, string> = {
  2: "01",
  8: "01234567",
  10: "0123456789",
  16: "0123456789ABCDEF",
}

const baseNames: Record<SupportedBase, Record<Language, string>> = {
  2: { en: "binary", de: "binär" },
  8: { en: "octal", de: "oktal" },
  10: { en: "decimal", de: "dezimal" },
  16: { en: "hexadecimal", de: "hexadezimal" },
}

export const baseDigitHints: Record<SupportedBase, Record<Language, string>> = {
  2: { en: "Use digits 0-1.", de: "Verwende die Ziffern 0-1." },
  8: { en: "Use digits 0-7.", de: "Verwende die Ziffern 0-7." },
  10: { en: "Use digits 0-9.", de: "Verwende die Ziffern 0-9." },
  16: { en: "Use digits 0-9 and A-F.", de: "Verwende die Ziffern 0-9 und A-F." },
}

/**
 * Returns the name of the base in the specified language.
 * @param lang
 * @param base
 */
export function baseLabel(lang: Language, base: SupportedBase): string {
  return baseNames[base][lang]
}

/**
 * Converts the input text to a normalized form for easier processing.
 * @param text
 */
export function normalizeBaseInput(text: string): string {
  return text.trim().toUpperCase()
}

/**
 * Checks whether the given text is a valid representation in the specified base.
 * @param text
 * @param base
 */
export function isValidBaseString(text: string, base: SupportedBase): boolean {
  const digits = baseDigits[base]
  const pattern = new RegExp(`^[${digits}]+$`)
  return pattern.test(text)
}

/**
 * Converts the given number to a string in the specified base.
 * @param value
 * @param base
 * @param padLength
 */
export function toBaseString(value: number, base: SupportedBase, padLength?: number): string {
  // toString already returns the correct representation for bases
  const baseString = value.toString(base).toUpperCase()
  if (padLength !== undefined) return baseString.padStart(padLength, "0")
  return baseString
}

/**
 * Generates a random string representation of a number in the specified base.
 * @param random
 * @param base
 * @param minLen
 * @param maxLen
 */
export function randomBaseString(
  random: Random,
  base: SupportedBase,
  minLen: number,
  maxLen: number,
): string {
  const length = random.int(minLen, maxLen)
  const digits = baseDigits[base]
  const firstIndex = 1 // keep non-zero leading digit
  let result = digits[random.int(firstIndex, digits.length - 1)]
  for (let i = 1; i < length; i++) {
    result += digits[random.int(0, digits.length - 1)]
  }
  return result
}
