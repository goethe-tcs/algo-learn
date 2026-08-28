import type { FreeTextQuestion, QuestionGenerator } from "../../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../../api/QuestionRouter.ts"
import Random from "../../../utils/random.ts"
import { t, tFunctional, type Translations } from "../../../utils/translations.ts"
import {
  baseDigitHints,
  baseLabel,
  isValidBaseString,
  normalizeBaseInput,
  randomBaseString,
  supportedBases,
  toBaseString,
  type SupportedBase,
} from "./baseUtils.ts"

const translations: Translations = {
  en: {
    name: "Base to Base",
    description: "Convert numbers between arbitrary bases.",
    text: "Convert the {{1}} number ${{0}}_{ {{2}} }$ to {{3}} (base {{4}}).",
  },
  de: {
    name: "Basis zu Basis",
    description: "Wandle Zahlen zwischen verschiedenen Basen um.",
    text: "Wandle die {{1}}e Zahl ${{0}}_{ {{2}} }$ in {{3}} (Basis {{4}}) um.",
  },
}

export const AnyBaseToAny: QuestionGenerator = {
  id: "basexy",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["math", "number systems", "conversion"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [],
  generate: (lang = "en", parameters, seed) => {
    const random = new Random(seed)
    const sourceBase: SupportedBase = random.choice(supportedBases)
    const targetBaseChoices = supportedBases.filter((b) => b !== sourceBase)
    const targetBase: SupportedBase = random.choice(targetBaseChoices)

    const lengths: Record<SupportedBase, [number, number]> = {
      2: [6, 12],
      8: [3, 5],
      10: [3, 4],
      16: [2, 4],
    }

    const [minLen, maxLen] = lengths[sourceBase]
    const sourceValue = randomBaseString(random, sourceBase, minLen, maxLen)
    const decimalValue = parseInt(sourceValue, sourceBase)
    const correctRepresentation = toBaseString(decimalValue, targetBase)
    const path = serializeGeneratorCall({ generator: AnyBaseToAny, lang, parameters, seed })

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: AnyBaseToAny.name(lang),
      path,
      text: t(translations, lang, "text", [
        sourceValue,
        baseLabel(lang, sourceBase),
        `${sourceBase}`,
        baseLabel(lang, targetBase),
        `${targetBase}`,
      ]),
      feedback: ({ text }) => {
        const normalized = normalizeBaseInput(text)
        const valid = normalized.length > 0 && isValidBaseString(normalized, targetBase)
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

    return {
      question,
      testing: { sourceBase, targetBase, sourceValue, decimalValue, correctRepresentation },
    }
  },
}
