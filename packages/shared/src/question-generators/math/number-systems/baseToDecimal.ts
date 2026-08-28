import type { FreeTextQuestion, QuestionGenerator } from "../../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../../api/QuestionRouter.ts"
import Random from "../../../utils/random.ts"
import { t, tFunctional, type Translations } from "../../../utils/translations.ts"
import { baseLabel, randomBaseString } from "./baseUtils.ts"

const sourceBases = [2, 8, 16] as const

type SourceBase = (typeof sourceBases)[number]

const translations: Translations = {
  en: {
    name: "Base to Decimal",
    description: "Convert binary, octal, or hexadecimal numbers to decimal.",
    text: "Convert the {{1}} number ${{0}}_{ {{2}} }$ to decimal (base 10).",
    formatHint: "Enter a non-negative decimal integer.",
  },
  de: {
    name: "Basis zu Dezimal",
    description: "Wandle Binär-, Oktal- oder Hexadezimalzahlen in Dezimal um.",
    text: "Wandle die {{1}}e Zahl ${{0}}_{ {{2}} }$ in Dezimal (Basis 10) um.",
    formatHint: "Gib eine nichtnegative Dezimalzahl ein.",
  },
}

export const BaseToDecimal: QuestionGenerator = {
  id: "basedec",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["math", "number systems", "conversion"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [],
  generate: (lang = "en", parameters, seed) => {
    const random = new Random(seed)
    const sourceBase: SourceBase = random.choice(sourceBases)
    const lengths: Record<SourceBase, [number, number]> = { 2: [5, 8], 8: [3, 4], 16: [2, 3] }
    const [minLen, maxLen] = lengths[sourceBase]
    const baseValue = randomBaseString(random, sourceBase, minLen, maxLen)
    const decimalValue = parseInt(baseValue, sourceBase)
    const path = serializeGeneratorCall({ generator: BaseToDecimal, lang, parameters, seed })

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: BaseToDecimal.name(lang),
      path,
      text: t(translations, lang, "text", [baseValue, baseLabel(lang, sourceBase), `${sourceBase}`]),
      feedback: ({ text }) => {
        const normalized = text.trim()
        const valid = /^\d+$/.test(normalized)
        const parsed = valid ? parseInt(normalized, 10) : NaN
        const correct = parsed === decimalValue
        return { correct, correctAnswer: `${decimalValue}` }
      },
      checkFormat: ({ text }) => {
        const normalized = text.trim()
        if (normalized.length === 0) {
          return { valid: false }
        }
        const valid = /^\d+$/.test(normalized)
        const hint = translations[lang]?.formatHint ?? ""
        return { valid, message: valid ? undefined : hint }
      },
    }

    return { question, testing: { sourceBase, baseValue, decimalValue } }
  },
}
