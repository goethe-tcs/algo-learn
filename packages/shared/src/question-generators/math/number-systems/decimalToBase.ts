import type { FreeTextQuestion, QuestionGenerator } from "../../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../../api/QuestionRouter.ts"
import Random from "../../../utils/random.ts"
import { t, tFunctional, type Translations } from "../../../utils/translations.ts"
import {
  baseDigitHints,
  baseLabel,
  isValidBaseString,
  normalizeBaseInput,
  toBaseString,
} from "./baseUtils.ts"

const targetBases = [2, 8, 16] as const

type TargetBase = (typeof targetBases)[number]

const translations: Translations = {
  en: {
    name: "Decimal to Base",
    description: "Convert decimal numbers to another base.",
    text: "Convert the decimal number ${{0}}$ to {{1}} (base {{2}}).",
  },
  de: {
    name: "Dezimal zu Basis",
    description: "Wandle Dezimalzahlen in ein anderes Zahlensystem um.",
    text: "Wandle die Dezimalzahl ${{0}}$ in {{1}} (Basis {{2}}) um.",
  },
}

export const DecimalToBase: QuestionGenerator = {
  id: "decbase",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["math", "number systems", "conversion"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [],
  generate: (lang = "en", parameters, seed) => {
    const path = serializeGeneratorCall({ generator: DecimalToBase, lang, parameters, seed })
    const random = new Random(seed)
    const targetBase: TargetBase = random.choice(targetBases)
    const decimalValue = random.int(targetBase === 2 ? 10 : 30, targetBase === 2 ? 255 : 4095)
    const correctRepresentation = toBaseString(decimalValue, targetBase)

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: DecimalToBase.name(lang),
      path,
      text: t(translations, lang, "text", [
        `${decimalValue}`,
        baseLabel(lang, targetBase),
        `${targetBase}`,
      ]),
      feedback: ({ text }) => {
        const normalized = normalizeBaseInput(text)
        const valid = isValidBaseString(normalized, targetBase)
        const correct = valid && parseInt(normalized, targetBase) === decimalValue
        return { correct, correctAnswer: correctRepresentation }
      },
      checkFormat: ({ text }) => {
        const normalized = normalizeBaseInput(text)
        if (normalized.length === 0) {
          return { valid: false }
        }
        const valid = normalized.length > 0 && isValidBaseString(normalized, targetBase)
        return { valid, message: valid ? undefined : baseDigitHints[targetBase][lang] }
      },
    }

    return { question, testing: { decimalValue, targetBase, correctRepresentation } }
  },
}
