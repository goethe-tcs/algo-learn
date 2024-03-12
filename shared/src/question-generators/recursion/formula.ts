import {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  minimalMultipleChoiceFeedback,
  Question,
  QuestionGenerator,
} from "../../api/QuestionGenerator"
import { serializeGeneratorCall } from "../../api/QuestionRouter"
import { format } from "../../utils/format"
import Random from "../../utils/random"
import { tFunction, tFunctional, Translations } from "../../utils/translations"
import { parseRecursiveFunction, sampleRecurrenceAnswers, sampleRecursiveFunction } from "./formulaUtils"

const translations: Translations = {
  en: {
    basecase: "The base case is",
    text1: "Consider the following recursive procedure `{{0}}` with integer input ${{1}}$:",
    text2: "Let ${{0}}$ be the number of stars (`*`) that the procedure prints.",
    "long-name": "Recurrence Relation",
    question: "What is the recurrence relation of",
    name: "Recurrence",
    description: "Determine the recurrence relation of a recursive function",
    bottomnote: "Note: This field expects a string of the form `{{0}}` as input.",
    "feedback.incomplete": "Incomplete or too complex",
  },
  de: {
    basecase: "Der Basisfall ist",
    text1: "Betrachte die folgende rekursive Prozedur `{{0}}` mit ganzzahliger Eingabe ${{1}}$:",
    text2: "Sei ${{0}}$ die Anzahl der Sterne (`*`), die die Prozedur ausgibt.",
    "long-name": "Rekurrenzrelation",
    question: "Was ist die Rekurrenzrelation von",
    name: "Rekurrenz",
    description: "Bestimme die Rekurrenzrelation einer rekursiven Funktion",
    bottomnote: "Hinweis: Dieses Feld erwartet einen String der Form `{{0}}` als Eingabe.",
    "feedback.incomplete": "Nicht vollständig oder zu komplex",
  },
}

export const RecursionFormula: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["choice", "input"],
    },
  ],
  generate(generatorPath, lang, parameters, seed) {
    const permalink = serializeGeneratorCall({
      generator: RecursionFormula,
      lang,
      parameters,
      seed,
      generatorPath,
    })
    const random = new Random(seed)
    const { t } = tFunction(translations, lang)

    const variant = parameters.variant as "choice" | "input"
    const { functionText, functionName, n, b, a, d, c } = sampleRecursiveFunction(random)

    const T = random.choice("TABCDEFGHS".split(""))
    const answers = sampleRecurrenceAnswers({ random, T, n, a, b, c, d })

    let text = `
${format(t("text1"), [functionName, n])}

\`\`\`python3
${functionText.trim()}
\`\`\`

${format(t("text2"), [`${T}(${n})`])}`

    if (variant !== "choice") {
      text += ` ${t("basecase")} $${T}(1)=${d}$.`
    }
    text += ` ${t("question") + " "} $${`${T}(${n})`}$`

    if (variant !== "choice") {
      text += ` ${t("for")} $${n} \\geq 2$`
    }
    text += " ?"

    let question: Question
    if (variant === "choice") {
      question = {
        type: "MultipleChoiceQuestion",
        name: t("long-name"),
        path: permalink,
        text: text,
        answers: answers.map(({ element }) => element),
        feedback: minimalMultipleChoiceFeedback({
          correctAnswerIndex: answers
            .map((x, i) => ({ ...x, i }))
            .filter((x) => x.correct)
            .map((x) => x.i),
        }),
      }
    } else {
      const prompt = `$${T}(${n}) =$ `
      const bottomText = t("bottomnote", [`a ${T}(${n}/b) + c`])

      const checkFormat: FreeTextFormatFunction = ({ text }) => {
        if (text.trim() === "") return { valid: false }
        try {
          const { a, b, c, T, n } = parseRecursiveFunction(text)
          return { valid: true, message: `${a} ${T}(${n}/${b}) + ${c}` }
        } catch (e) {
          return { valid: false, message: t("feedback.incomplete") }
        }
      }

      const feedback: FreeTextFeedbackFunction = ({ text }) => {
        const correctAnswer = `$${a} ${T}(${n}/${b}) + ${c}$`

        let p: ReturnType<typeof parseRecursiveFunction>
        try {
          p = parseRecursiveFunction(text)
        } catch (e) {
          return {
            correct: false,
            message: t("feedback.incomplete"),
            correctAnswer,
          }
        }

        return {
          correct: p.a === a && p.b === b && p.c === c && p.T === T && p.n === n,
          correctAnswer,
        }
      }
      question = {
        type: "FreeTextQuestion",
        path: permalink,
        name: t("long-name"),
        text,
        prompt,
        bottomText,
        feedback,
        checkFormat,
      }
    }
    return { question }
  },
}
