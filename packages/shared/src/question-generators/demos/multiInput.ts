import type { MultiFreeTextQuestion, QuestionGenerator } from "../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../api/QuestionRouter.ts"
import Random from "../../utils/random.ts"
import { t, tFunctional, type Translations } from "../../utils/translations.ts"

/**
 * All displayed text goes into the translations object.
 * Include at least english and german.
 */
const translations: Translations = {
  en: {
    name: "Multi Input Question",
    description: "Compute the sum of two integers",
    text: "Solve the following sums:\n{{test1#-#A) {{0}} + {{1}} = #sum}}\n{{test2#-#B) {{2}} + {{3}} = #sum}}",
  },
  de: {
    name: "Frage mit mehreren Eingabefeldern",
    description: "Berechne die Summe zweier Zahlen",
    text: "Löse die folgenden Summen:\n{{test1#-#A) {{0}} + {{1}} = #Summe}}\n {{test2#-#B) {{2}} + {{3}} = #Summe}}",
  },
}

/**
 * This question generator generates a simple multiple choice question.
 */
export const DemoMultiInput: QuestionGenerator = {
  id: "demomi",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["demo"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [],

  /**
   * Generates a new MultiFreeText Question question.
   *
   * @param lang The language of the question
   * @param parameters The parameters for the question. In this case none are used.
   * @param seed The seed for the random number generator
   * @returns A new MultipleChoiceQuestion question
   */
  generate: (lang = "en", parameters, seed) => {
    // initialize the RNG so the question can be generated again
    const random = new Random(seed)

    // generate the question values
    const a = [random.int(5, 15), random.int(5, 15)]
    const b = [random.int(5, 15), random.int(5, 15)]

    // generate the question object
    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: DemoMultiInput.name(lang),
      path: serializeGeneratorCall({
        generator: DemoMultiInput,
        lang,
        parameters,
        seed,
      }),
      fillOutAll: true,
      text: t(translations, lang, "text", [`${a[0]}`, `${b[0]}`, `${a[1]}`, `${b[1]}`]),
      feedback: (answer) => {
        return {
          correct:
            parseInt(answer.text["test1"]) === a[0] + b[0] &&
            parseInt(answer.text["test2"]) === a[1] + b[1],
          correctAnswer: `${a[0]} + ${b[0]} = ${a[0] + b[0]}, ${a[1]} + ${b[1]} = ${a[1] + b[1]}`,
        }
      },
      checkFormat: ({ text }, fieldID) => {
        const val = parseInt(text[fieldID])
        return { valid: !Number.isNaN(val), message: `${val}` }
      },
    }

    return {
      question,
    }
  },
}
