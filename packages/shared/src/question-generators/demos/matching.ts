import {
  minimalMultipleChoiceFeedback,
  type MatchingFeedback,
  type MatchingFeedbackFunction,
  type MatchingQuestion,
  type MultipleChoiceAnswer,
  type QuestionGenerator,
} from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import Random from "@shared/utils/random"
import { t, tFunctional, type Translations } from "@shared/utils/translations"

const translations: Translations = {
  en: {
    name: "Matching",
    description: "Match Greek letters with their symbols",
    text: "Match the following Greek letters with their symbols:",
  },
  de: {
    name: "Zuordnung",
    description: "Ordne griechische Buchstaben ihren Symbolen zu",
    text: "Ordne die folgenden griechischen Buchstaben ihren Symbolen zu:",
  },
}

// full set of pairings
const pairs: [string, string][] = [
  ["Alpha", "$\\alpha$"],
  ["Beta", "$\\beta$"],
  ["Gamma", "$\\gamma$"],
  ["Delta", "$\\delta$"],
  ["Epsilon", "$\\epsilon$"],
  ["Zeta", "$\\zeta$"],
  ["Eta", "$\\eta$"],
  ["Theta", "$\\theta$"],
  ["Iota", "$\\iota$"],
  ["Kappa", "$\\kappa$"],
  ["Lambda", "$\\lambda$"],
  ["Mu", "$\\mu$"],
  ["Nu", "$\\nu$"],
  ["Xi", "$\\xi$"],
  ["Omicron", "$\\omicron$"],
  ["Pi", "$\\pi$"],
  ["Rho", "$\\rho$"],
  ["Sigma", "$\\sigma$"],
  ["Tau", "$\\tau$"],
  ["Upsilon", "$\\upsilon$"],
  ["Phi", "$\\phi$"],
  ["Chi", "$\\chi$"],
  ["Psi", "$\\psi$"],
  ["Omega", "$\\omega$"],
]

export const DemoMatching: QuestionGenerator = {
  id: "demom",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["demo"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [],

  generate: (lang = "en", parameters, seed) => {
    const random = new Random(seed)

    const n = random.int(5, 11)
    const chosenPairs = random.subset(pairs, n)

    // shuffle chosen pairs
    const shuffledPairs = random.shuffle(chosenPairs)

    const fixed = shuffledPairs.map(([l]) => l)
    const movable = shuffledPairs.map(([, r]) => r)

    // shuffle sortable column
    const movableShuffled = random.shuffle(movable)

    // correct order mapping
    const solution = fixed.map((l) => movableShuffled.indexOf(chosenPairs.find(([pl]) => pl === l)![1]))

    const baseFeedback = minimalMultipleChoiceFeedback({
      correctAnswerIndex: solution,
      sorting: true,
    })

    const feedback: MatchingFeedbackFunction = async (
      answer: MultipleChoiceAnswer,
    ): Promise<MatchingFeedback> => {
      const result = await baseFeedback(answer)
      const rowCorrectness = solution.map((c, i) => answer.choice[i] === c)
      return { ...result, rowCorrectness }
    }

    const question: MatchingQuestion = {
      type: "MatchingQuestion",
      name: DemoMatching.name(lang),
      path: serializeGeneratorCall({
        generator: DemoMatching,
        lang,
        parameters,
        seed,
      }),
      text: t(translations, lang, "text"),
      fixedItems: fixed,
      answers: movableShuffled,
      feedback,
      columns: 5,
      fillOutAll: true,
    }

    return { question }
  },
}
