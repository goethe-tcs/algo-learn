import type {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  FreeTextQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../api/QuestionRouter.ts"
import { stringifyPseudoCode } from "../../utils/pseudoCodeUtils.ts"
import Random from "../../utils/random.ts"
import { tFunction, tFunctional, type Translations } from "../../utils/translations.ts"
import { sampleLoopStars } from "./utilsStars/general.ts"

const translations: Translations = {
  en: {
    name: "Loops",
    longTitle: "Loops",
    description: "Determine the number of iterations in a loop",
    simpleExactDescription: "Consider the following code:",
    simpleExactQuestion: "How many stars are printed?",
    "feedback.nan": "Not a number",
  },
  de: {
    name: "Schleifen",
    longTitle: "Schleifen",
    description: "Bestimme die Anzahl der Iterationen in einer Schleife",
    simpleExactDescription: "Betrachte den folgenden Code:",
    simpleExactQuestion: "Wie viele Sterne werden ausgegeben?",
    "feedback.nan": "keine Zahl",
  },
}

export const Loops: QuestionGenerator = {
  id: "loops",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["simpleExact"],
    },
  ],
  generate(lang, parameters, seed) {
    const { t } = tFunction(translations, lang)

    const permalink = serializeGeneratorCall({
      generator: Loops,
      lang,
      parameters,
      seed,
    })

    const random = new Random(seed)
    const { functionText, functionName, n, numStars } = sampleLoopStars(random)

    const description = `
${t("simpleExactDescription", [functionName, n])}

${stringifyPseudoCode(functionText)}

${t("simpleExactQuestion")}`
    const checkFormat: FreeTextFormatFunction = ({ text }) => {
      text = text.replace(/\s/g, "")
      if (text === "") {
        return { valid: false }
      }
      if (isNaN(parseInt(text, 10))) {
        return { valid: false, message: t("feedback.nan") }
      }
      return { valid: true }
    }
    const feedback: FreeTextFeedbackFunction = ({ text }) => {
      if (text === "") {
        return {
          isValid: false,
          isCorrect: false,
          message: null,
        }
      }
      const m = text.match(/^\d+$/)
      const p = parseInt(text, 10)
      if (m === null || isNaN(p)) {
        return {
          correct: false,
          message: t("feedback.nan"),
          correctAnswer: `${numStars}`,
        }
      } else {
        return {
          correct: p === numStars,
          message: `${p}`,
          correctAnswer: `${numStars}`,
        }
      }
    }
    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: t("longTitle"),
      text: description,
      path: permalink,
      checkFormat,
      feedback,
    }
    const testing = {
      functionText,
      functionName,
      numStars,
    }
    return { question, testing }
  },
}
