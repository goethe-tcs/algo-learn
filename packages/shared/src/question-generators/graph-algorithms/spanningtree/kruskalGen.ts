import { min } from "mathjs"
import type { Language } from "@shared/api/Language.ts"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { kruskalAlgorithm } from "@shared/question-generators/graph-algorithms/spanningtree/kruskalAlgo.ts"
import {
  edgeInputFieldID,
  getNodeLabel,
  RandomGraph,
  type Edge,
  type Graph,
} from "@shared/utils/graph.ts"
import { checkEdgeInput, setEdgesGroup } from "@shared/utils/graphInput.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Kruskal Algorithm",
    description: "Correctly execute the Kruskal algorithm",
    task: "Given the graph $G$: {{0}} Select the first ${{1}}$ edges that `Kruskal`’s algorithm considers but rejects because they would form a cycle.",
    fdParse: "Your response could not be parsed into a list of edges.",
    fdAmount: "You have selected $ {{0}} $ edges, but should have selected $ {{1}} $ edges.",
    fdWrong: "The selected edges are not the correct ones.",
    param_size: "Size of the graph.",
  },
  de: {
    name: "Kruskal-Algorithmus",
    description: "Führe den Kruskal-Algorithmus korrekt aus",
    task: "Gegeben ist der Graph $G$: {{0}} Wähle die ersten ${{1}}$ Kanten aus, die der `Kruskal`-Algorithmus in Betracht zieht, aber verwirft, weil sie einen Zyklus bilden würden.",
    fdParse: "Deine Antwort konnte nicht als Liste von Kanten interpretiert werden.",
    fdAmount: "Du hast $ {{0}} $ Kanten ausgewählt, aber es sollten $ {{1}} $ sein.",
    fdWrong: "Die ausgewählten Kanten sind nicht korrekt.",
    param_size: "Größe des Graphen.",
  },
}

export const KruskalCycle: QuestionGenerator = {
  id: "kruskalcyc",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: [],
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
      generator: KruskalCycle,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)
    const size = parameters.size as number

    let G: Graph
    let kruskalResult: { mst: Edge[]; cycle: Edge[] }
    do {
      G = RandomGraph.grid(
        random,
        [size, size],
        1,
        random.choice(["square", "square-width-diagonals", "triangle"]),
        "unique", // otherwise kruskal sorts them differently than the user
        false,
        random.bool(),
      )
      kruskalResult = kruskalAlgorithm(G)
    } while (kruskalResult.cycle.length < 2)

    G.inputFieldID = 1
    G.edgeGroupMax = 2
    G.edgeClickType = "select"
    G.nodeDraggable = false
    let numEdges: number
    if (kruskalResult.cycle.length === 2) {
      numEdges = 2
    } else {
      numEdges = random.int(2, min(4, kruskalResult.cycle.length - 1))
    }
    kruskalAlgorithm(G)

    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: KruskalCycle.name(lang),
      path: permaLink,
      text: t(translations, lang, "task", [G.toMarkdown(), numEdges.toString()]),
      feedback: getFeedback(G, kruskalResult.cycle.slice(0, numEdges), lang),
    }

    return { question }
  },
}

function getFeedback(G: Graph, cycleEdges: Edge[], lang: Language): MultiFreeTextFeedbackFunction {
  return ({ text }) => {
    setEdgesGroup(G, cycleEdges, 1)
    G.edgeClickType = "selectupgrade"
    const edgeInput = checkEdgeInput(text[edgeInputFieldID(1)], G, lang)
    if (!edgeInput.parsed || !("selected" in edgeInput)) {
      return {
        correct: false,
        correctAnswer: G.toMarkdown(),
        feedbackText: t(translations, lang, "fdParse"),
      }
    }

    const selectedEdges = edgeInput.selected
    if (selectedEdges.length !== cycleEdges.length) {
      return {
        correct: false,
        correctAnswer: G.toMarkdown(),
        feedbackText: t(translations, lang, "fdAmount", [
          selectedEdges.length.toString(),
          cycleEdges.length.toString(),
        ]),
      }
    }

    // Check if the selected edges are the correct ones
    for (const edge of cycleEdges) {
      if (
        !selectedEdges.some(
          (selectedEdge) =>
            (selectedEdge[0] === getNodeLabel(edge.source) &&
              selectedEdge[1] === getNodeLabel(edge.target)) ||
            (selectedEdge[1] === getNodeLabel(edge.source) &&
              selectedEdge[0] === getNodeLabel(edge.target)),
        )
      ) {
        return {
          correct: false,
          correctAnswer: G.toMarkdown(),
          feedbackText: t(translations, lang, "fdWrong"),
        }
      }
    }

    return {
      correct: true,
    }
  }
}
