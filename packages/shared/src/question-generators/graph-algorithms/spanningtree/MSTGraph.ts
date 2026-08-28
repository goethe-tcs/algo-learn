import type { Language } from "@shared/api/Language.ts"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { kruskalAlgorithm } from "@shared/question-generators/graph-algorithms/spanningtree/kruskalAlgo.ts"
import { computeAllMST } from "@shared/question-generators/graph-algorithms/spanningtree/primAlgo.ts"
import { isSpanningTree } from "@shared/question-generators/graph-algorithms/spanningtree/utils.ts"
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
    name: "Minimum Spanning Tree (Graph)",
    description: "Compute a minimum spanning tree",
    task: `Given the graph $G$: {{0}} 
           Compute a minimum spanning tree for $G$ by selecting the corresponding edges in $G$.`,
    fdParse: "Your response could not be parsed into a list of edges.",
    fdEdgeAmount: `You have selected $ {{0}} $ edges, but the minimum spanning tree includes exactly $ {{1}} $ edges.`,
    fdNotSpanningTree: "The selected edges do not form a spanning tree.",
    fdWeight: "The weight of the selected edges is higher than the weight of the minimum spanning tree.",
    param_size: "Size of the graph.",
  },
  de: {
    name: "Minimaler Spannbaum (Graph)",
    description: "Berechne einen minimalen Spannbaum",
    task: `Gegeben ist der Graph $G$: {{0}} 
           Berechne einen minimalen Spannbaum für $G$, indem du die entsprechenden Kanten in $G$ auswählst.`,
    fdParse: "Deine Antwort konnte nicht als Liste von Kanten interpretiert werden.",
    fdEdgeAmount: `Du hast $ {{0}} $ Kanten ausgewählt, aber der minimale Spannbaum enthält genau $ {{1}} $ Kanten.`,
    fdNotSpanningTree: "Die ausgewählten Kanten bilden keinen Spannbaum.",
    fdWeight: "Das Gewicht der ausgewählten Kanten ist höher als das Gewicht des minimalen Spannbaums.",
    param_size: "Größe des Graphen.",
  },
}

export const MSTGraphGen: QuestionGenerator = {
  id: "mstgraph",
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
      min: 2,
      max: 4,
    },
  ],

  generate: (lang = "en", parameters, seed) => {
    const permaLink = serializeGeneratorCall({
      generator: MSTGraphGen,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)
    const size = parameters.size as number

    // Todo: Future: Change this graph something more random
    const G = RandomGraph.grid(
      random,
      [size, size],
      1,
      random.choice(["square", "square-width-diagonals", "triangle"]),
      "random",
      false,
      random.bool(),
    )
    G.edgeClickType = "select"
    G.edgeGroupMax = 2
    G.nodeDraggable = false
    G.inputFieldID = 1

    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: MSTGraphGen.name(lang),
      path: permaLink,
      text: t(translations, lang, "task", [G.toMarkdown()]),
      feedback: getFeedback(G, random, lang),
    }
    return { question }
  },
}

/**
 * Function to check the user input:
 * - Check if the input is a valid edge list
 * - Check if the input is a valid spanning tree
 * - Check if the input has the correct weight
 * @param graph
 * @param random - to choose between different correct answers
 * @param lang
 */
function getFeedback(graph: Graph, random: Random, lang: Language): MultiFreeTextFeedbackFunction {
  return ({ text }) => {
    const MST = (
      random.bool() ? kruskalAlgorithm(graph) : computeAllMST(graph, random.choice(graph.nodes))[0]
    ).mst
    setEdgesGroup(graph, MST, 1)
    graph.edgeClickType = "selectupgrade"

    const edgeInput = checkEdgeInput(text[edgeInputFieldID(1)], graph, lang)
    if (!edgeInput.parsed || !("selected" in edgeInput)) {
      return {
        correct: false,
        correctAnswer: graph.toMarkdown(),
        feedbackText: t(translations, lang, "fdParse"),
      }
    }

    // All edges in .selected are in the graph
    const selectedEdges = edgeInput.selected
    if (selectedEdges.length !== graph.getNumNodes() - 1) {
      return {
        correct: false,
        correctAnswer: graph.toMarkdown(),
        feedbackText: t(translations, lang, "fdEdgeAmount", [
          selectedEdges.length.toString(),
          MST.length.toString(),
        ]),
      }
    }

    const mappedEdges = mapEdgeLabelToEdge(selectedEdges, graph)
    if (!isSpanningTree(graph.getNumNodes(), mappedEdges)) {
      return {
        correct: false,
        correctAnswer: graph.toMarkdown(),
        feedbackText: t(translations, lang, "fdNotSpanningTree"),
      }
    }

    const userWeight = mappedEdges.reduce((acc, x) => acc + (x.value ?? 1), 0)
    const correctWeight = MST.reduce((acc, x) => acc + (x.value ?? 1), 0)
    if (userWeight !== correctWeight) {
      return {
        correct: false,
        correctAnswer: graph.toMarkdown(),
        feedbackText: t(translations, lang, "fdWeight"),
      }
    }

    return {
      correct: true,
    }
  }
}

/**
 * Map the edge labels to the edges in the graph
 * @param edgeLabels
 * @param graph
 */
function mapEdgeLabelToEdge(edgeLabels: [string, string][], graph: Graph): Edge[] {
  const edges: Edge[] = []
  for (const label of edgeLabels) {
    outer: for (let i = 0; i < graph.edges.length; i++) {
      for (let j = 0; j < graph.edges[i].length; j++) {
        if (
          getNodeLabel(graph.edges[i][j].source) === label[0] &&
          getNodeLabel(graph.edges[i][j].target) === label[1]
        ) {
          edges.push(graph.edges[i][j])
          break outer
        }
      }
    }
  }
  return edges
}
