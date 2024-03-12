import { format } from "../utils/format"
import Random from "../utils/random"
import { DeepTranslations, getValidLanguage } from "../utils/translations"
import { Language } from "./Language"
import { ExpectedParameters, Parameters } from "./Parameters"
import {
  minimalMultipleChoiceFeedback,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "./QuestionGenerator"
import { serializeGeneratorCall } from "./QuestionRouter"

/**
 * Interface for "basic" Multiple-Choice Questions. These are fairly static,
 * text-based questions. Randomness will be used to replace parameter names with
 * random string (usually variable and function names) and to shuffle the
 * answers.
 */
export interface BasicMultipleChoiceQuestion {
  /**
   * Optionally, we can declare parameters that are replaced with random
   * strings, for example, "{{var}}" could be replaced with "x", "y", or "z".
   *
   * @example
   *   parameters: {
   *   "var1": "xyz",
   *   "var2": "xyz",
   *   }
   *   in the following texts, {{var1}} and {{var2}} with be replaced with a random character]
   *   from the given string. It is made sure the chosen strings for var1 and var2 are distinct.
   *   Multi-character strings can be given as a list as follows.
   *   parameters: {
   *   "func": ["\\log n", "n^7"]
   *   }
   */
  parameters?: Record<string, string | string[]>

  /**
   * Is invoked to add a frame around the question that could be similar to several questions.
   * If provided, make sure frame() provides all languages the questions support.
   * @param lang
   * @param question
   * @returns
   */
  frame?: (lang: Language, question: string) => string

  /**
   * Provides translations for the question text as well as for the correct and
   * wrong answers.
   */
  translations: DeepTranslations &
    Partial<Record<Language, { text: string; correctAnswers: string[]; wrongAnswers: string[] }>>
}

/**
 * Given a name function and a set of BasicMultipleChoiceQuestions,
 * the function returns a QuestionGenerator for the set of questions.
 *
 * @param name The title of the question
 * @param questions The questions to ask
 * @returns The question as a QuestionGenerator object
 */
export function basicMultipleChoiceMetaGenerator(
  name: (lang: Language) => string,
  questions: BasicMultipleChoiceQuestion[],
  description?: (lang: Language) => string,
): QuestionGenerator {
  const variants = questions.map((_, i) => i)
  const languages = Object.keys(questions[0].translations) as Language[]
  const expectedParameters: ExpectedParameters =
    variants.length > 0
      ? [
          {
            type: "integer",
            name: "number",
            min: 0,
            max: variants.length - 1,
          },
        ]
      : []

  function generate(generatorPath: string, lang: Language, parameters: Parameters, seed: string) {
    const i = parameters.number as number

    const random = new Random(seed)

    const vars = questions[i].parameters
    const p: Record<string, string> = {}
    if (vars !== undefined) {
      const usedValues: string[] = []
      Object.keys(vars).forEach((pattern) => {
        let replacement = vars[pattern]
        if (typeof replacement === "string") {
          replacement = replacement.split("")
        }
        replacement = replacement.filter((c) => !usedValues.includes(c))
        p[pattern] = random.choice(replacement)
        usedValues.push(p[pattern])
      })
    }

    const l = getValidLanguage(lang, questions[i].translations)
    const ownt = questions[i].translations[l]!

    const numCorrect = ownt.correctAnswers.length
    const answers = ownt.correctAnswers
      .map((a: string, index: number) => ({
        correct: true,
        key: `answer-${index}`,
        element: format(a, p),
      }))
      .concat(
        ownt.wrongAnswers.map((a: string, index: number) => ({
          correct: false,
          key: `answer-${numCorrect + index}`,
          element: format(a, p),
        })),
      )

    random.shuffle(answers)

    const markdown =
      questions[i].frame === undefined ? ownt["text"] : questions[i].frame!(l, ownt["text"])

    const question: MultipleChoiceQuestion = {
      type: "MultipleChoiceQuestion",
      name: name(lang),
      path: serializeGeneratorCall({
        generator,
        lang,
        parameters,
        seed,
        generatorPath,
      }),
      answers: answers.map(({ element }) => element),
      text: format(markdown, p),
      allowMultiple: true,
      feedback: minimalMultipleChoiceFeedback({
        correctAnswerIndex: answers
          .map((x, i) => ({ ...x, i }))
          .filter((x) => x.correct)
          .map((x) => x.i),
      }),
    }
    return { question }
  }

  const generator: QuestionGenerator = {
    name,
    description,
    languages,
    expectedParameters,
    generate,
  }

  return generator
}
