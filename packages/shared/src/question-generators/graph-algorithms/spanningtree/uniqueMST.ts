import type { Language } from "@shared/api/Language.ts"
import type {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  FreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { getNumOfAllMST } from "@shared/question-generators/graph-algorithms/spanningtree/primAlgo.ts"
import { RandomGraph, type Graph } from "@shared/utils/graph.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Unique MSTs",
    description: "Compute the number of unique minimum spanning trees",
    task: "Given the graph $G$: {{0}} Compute the number of unique minimum spanning trees.",
    fdParse: "Your response could not be converted into an integer.",
    cfParse: "Only positive integers are allowed.",
    param_size: "Size of the graph",
  },
  de: {
    name: "Eindeutige MSTs",
    description: "Berechne die Anzahl der eindeutigen minimalen Spannbäume",
    task: "Gegeben ist der Graph $G$: {{0}} Berechne die Anzahl der eindeutigen minimalen Spannbäume.",
    fdParse: "Deine Antwort konnte nicht in eine ganze Zahl umgewandelt werden.",
    cfParse: "Es sind nur positive ganze Zahlen erlaubt.",
    param_size: "Größe des Graphen",
  },
}

export const UniqueMSTGen: QuestionGenerator = {
  id: "mstunique",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["MST"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [
    {
      name: "size",
      description: tFunctional(translations, "param_size"),
      type: "integer",
      min: 3,
      max: 4,
    },
  ],

  generate: (lang = "en", parameters, seed) => {
    const permaLink = serializeGeneratorCall({
      generator: UniqueMSTGen,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)
    const size = parameters.size as number

    let G: Graph
    let numUniqueMST: number
    let rounds = 0
    let threshold = 2
    do {
      G = RandomGraph.grid(
        random,
        [size, size],
        1,
        random.choice(["square", "square-width-diagonals", "triangle"]),
        "random",
        false,
        random.bool(),
      )
      numUniqueMST = getNumOfAllMST(G)
      rounds++
      if (rounds > 10) {
        threshold--
        rounds = 0
      }
    } while (numUniqueMST <= threshold)

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: UniqueMSTGen.name(lang),
      path: permaLink,
      text: t(translations, lang, "task", [G.toMarkdown()]),
      feedback: getFeedback(numUniqueMST, lang),
      checkFormat: getCheckFormat(lang),
    }
    return { question }
  },
}

/**
 * Feedback function parsing the user input and checking for correctness
 * @param numUniqueMST
 * @param lang
 */
function getFeedback(numUniqueMST: number, lang: Language): FreeTextFeedbackFunction {
  return ({ text }) => {
    if (text.trim() === "") {
      return { correct: false, correctAnswer: numUniqueMST.toString() }
    }
    const answer = text.replaceAll(" ", "")
    const answerValue = Number.parseInt(answer, 10)

    if (Number.isNaN(answerValue)) {
      return {
        correct: false,
        correctAnswer: numUniqueMST.toString(),
        feedbackText: t(translations, lang, "fdParse"),
      }
    }
    if (answerValue !== numUniqueMST) {
      return { correct: false, correctAnswer: numUniqueMST.toString() }
    }

    return {
      correct: true,
    }
  }
}

function getCheckFormat(lang: Language): FreeTextFormatFunction {
  return ({ text }) => {
    const answer = text.replaceAll(" ", "")
    const answerValue = Number.parseInt(answer, 10)

    if (Number.isNaN(answerValue) || answerValue < 1) {
      return {
        valid: false,
        message: t(translations, lang, "cfParse"),
      }
    }

    return {
      valid: true,
      message: answerValue.toString(),
    }
  }
}
