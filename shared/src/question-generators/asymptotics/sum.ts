import {
  minimalMultipleChoiceFeedback,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator"
import { serializeGeneratorCall } from "../../api/QuestionRouter"
import { format } from "../../utils/format"
import Random from "../../utils/random"
import { tFunction, tFunctional, Translations } from "../../utils/translations"
import { sampleTermSet, TermSetVariants } from "./asymptoticsUtils"

const translations: Translations = {
  en: {
    text: "Let ${{0}}$ be defined via \\[{{1}}\\,.\\] Which asymptotic growth is correct for this function? Choose exactly one answer:",
    description: "Determine the asymptotically dominant term in a sum",
    name: "Sum",
  },
  de: {
    text: "Sei ${{0}}$ definiert durch \\[{{1}}\\,.\\] Welches asymptotische Wachstum ist für diese Funktion richtig? Wähle genau eine Antwort aus:",
    description: "Bestimme den asymptotisch dominanten Term in einer Summe",
    name: "Summe",
  },
}
/**
 * Generate and render a question about simplifying sums
 *
 * @returns Output
 */
export const SimplifySum: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["pure", "polylog", "polylogexp"],
    },
  ],
  generate(generatorPath, lang, parameters, seed) {
    const permalink = serializeGeneratorCall({
      generator: SimplifySum,
      lang,
      parameters,
      seed,
      generatorPath,
    })
    const random = new Random(seed)
    const { t } = tFunction(translations, lang)

    const variant = parameters.variant as TermSetVariants

    const functionName = random.choice("fghFGHT".split(""))
    const variable = random.choice("nmNMxyztk".split(""))
    const sum = sampleTermSet({ variable, numTerms: 4, variant, random })
    const correctTerm = sum
      .slice()
      .sort((t1, t2) => t1.compare(t2))
      .at(-1)
    const answers = sum.map((term) => ({
      key: term.toLatex(variable, true),
      element: `$\\Theta\\big(${term.toLatex(variable, true)}\\big)$`,
      correct: term === correctTerm,
    }))

    const functionDeclaration = `${functionName}\\colon\\mathbb N\\to\\mathbb R`
    const functionDefinition = `${functionName}(${variable})=${sum.map((t) => t.toLatex()).join(" + ")}`

    const question: MultipleChoiceQuestion = {
      type: "MultipleChoiceQuestion",
      name: t("name"),
      text: format(t("text" ?? "text", [functionDeclaration, functionDefinition])),
      answers: answers.map(({ element }) => element),
      feedback: minimalMultipleChoiceFeedback({
        correctAnswerIndex: answers
          .map((x, i) => ({ ...x, i }))
          .filter((x) => x.correct)
          .map((x) => x.i),
      }),
      path: permalink,
    }
    return { question }
  },
}
