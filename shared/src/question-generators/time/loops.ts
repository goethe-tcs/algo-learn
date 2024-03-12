import {
  FreeTextFeedbackFunction,
  FreeTextQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator"
import { serializeGeneratorCall } from "../../api/QuestionRouter"
import Random from "../../utils/random"
import { tFunction, tFunctional, Translations } from "../../utils/translations"
import { RecursionFormula } from "../recursion/formula"
import { sampleLoop } from "./loopsUtils"

const translations: Translations = {
  en: {
    name: "Loops",
    description: "Determine the number of iterations in a loop",
    text1: "Consider the following procedure `{{0}}` with integer input ${{1}}$:",
    text2: "Let ${{0}}$ be the number of stars (`*`) that the procedure prints.",
    "long-title": "Loops",
    "simpleExact.description": "Consider the following piece of code:",
    "simpleExact.prompt": "Number of stars:",
    "simpleExact.question": "How many stars are printed?",
  },
  de: {
    name: "Schleifen",
    description: "Bestimme die Anzahl der Iterationen in einer Schleife",
    text1: "Betrachte die folgende Prozedur {{0}} mit ganzzahliger Eingabe {{1}}:",
    text2: "Sei ${{0}}$ die Anzahl der Sterne (`*`), die die Prozedur ausgibt.",
    "long-title": "Schleifen",
    "simpleExact.description": "Betrachte den folgenden Code:",
    "simpleExact.prompt": "Anzahl der Sterne:",
    "simpleExact.question": "Wie viele Sterne werden ausgegeben?",
  },
}

export const Loops: QuestionGenerator = {
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
  generate(generatorPath, lang, parameters, seed) {
    const { t } = tFunction(translations, lang)

    const permalink = serializeGeneratorCall({
      generator: RecursionFormula,
      lang,
      parameters,
      seed,
      generatorPath,
    })

    const random = new Random(seed)
    const { functionText, functionName, n, numStars } = sampleLoop(random)

    const T = random.choice("TABCDEFGHS".split(""))
    const description = `
${t("text1", [functionName, n])}

\`\`\`python3
${functionText}
\`\`\`

${t("text2", [`${T}(${n})`])}`
    const prompt = t("simpleExact.prompt")
    const feedback: FreeTextFeedbackFunction = ({ text }) => {
      if (text === "") {
        return {
          isValid: false,
          isCorrect: false,
          FeedbackText: null,
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
      name: t("long-title"),
      text: description,
      path: permalink,
      feedback,
      prompt,
    }
    return { question }
  },
}
