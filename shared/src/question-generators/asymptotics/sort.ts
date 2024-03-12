import {
  minimalMultipleChoiceFeedback,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator"
import { serializeGeneratorCall } from "../../api/QuestionRouter"
import Random from "../../utils/random"
import { tFunction, tFunctional, Translations } from "../../utils/translations"
import { sampleTermSet, SimpleAsymptoticTerm, TermSetVariants } from "./asymptoticsUtils"

const translations: Translations = {
  en: {
    name: "Sort",
    description: "Compare functions by their asymptotic growth",
    text: "Sort the following terms from smallest to largest growth rate:",
  },
  de: {
    name: "Sortiere",
    description: "Vergleiche Funktionen nach ihrem asymptotischen Wachstum",
    text: "Sortiere die folgenden Terme von kleinstem zu größtem asymptotischen Wachstum:",
  },
}
/**
 * Generate and render a question about sorting terms
 *
 * This exercise trains students on the competency of understanding and applying
 * asymptotic notation in the context of analyzing algorithmic time complexity.
 * Specifically, the exercise focuses on the skill of sorting terms in order of
 * their growth rate, which is a key step in analyzing the time complexity of an
 * algorithm.
 *
 * By practicing this skill, students will become more familiar with the
 * different types of asymptotic notation (e.g., big-O, big-omega, big-theta),
 * and they will learn how to identify the dominant term in an expression and
 * compare its growth rate with other terms. This is a foundational skill for
 * analyzing the time complexity of algorithms and designing efficient
 * algorithms.
 *
 * @returns Output
 */
export const SortTerms: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["start", "pure", "polylog", "polylogexp"],
    },
  ],
  generate: (generatorPath, lang, parameters, seed) => {
    const { t } = tFunction(translations, lang)

    const random = new Random(seed)
    const variable = random.choice("nmNMxyztk".split(""))

    interface AsymptoticTermWithIndex extends SimpleAsymptoticTerm {
      index: number
      correctIndex: number
    }

    const set = sampleTermSet({
      variable,
      numTerms: 5,
      variant: parameters.variant as TermSetVariants,
      random,
    }) as Array<AsymptoticTermWithIndex>
    for (const [i, t] of set.entries()) {
      t.index = i
    }
    const sorted = set.slice().sort((t1, t2) => t1.compare(t2))
    for (const [i, t] of sorted.entries()) {
      t.correctIndex = i
    }

    const answers = set.map((t) => ({
      key: t.toLatex(variable, true),
      index: t.index,
      text: `$${t.toLatex(variable, true)}$`,
      correctIndex: t.correctIndex,
    }))
    const question: MultipleChoiceQuestion = {
      type: "MultipleChoiceQuestion",
      sorting: true,
      name: SortTerms.name(lang),
      path: serializeGeneratorCall({
        generator: SortTerms,
        lang,
        parameters,
        seed,
        generatorPath,
      }),
      text: t("text"),
      answers: answers.map((a) => a.text),
      feedback: minimalMultipleChoiceFeedback({
        correctAnswerIndex: answers.sort((a, b) => a.correctIndex - b.correctIndex).map((a) => a.index),
        sorting: true,
      }),
    }

    return { question }
  },
}
