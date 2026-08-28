import type { Language } from "@shared/api/Language.ts"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextFormatFunction,
  MultiFreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import {
  getNodeLabel,
  nodeInputFieldID,
  RandomGraph,
  type Graph,
  type Node,
} from "@shared/utils/graph.ts"
import { checkNodeInput } from "@shared/utils/graphInput.ts"
import Random from "@shared/utils/random"
import { t, tFunctional, type Translations } from "@shared/utils/translations"

/**
 * All displayed text goes into the translation object.
 * Include at least english and german.
 */
const translations: Translations = {
  en: {
    name: "Graph Node Input Question",
    description: "Select specific nodes.",
    text:
      "Select all nodes that can be reached from node $ {{1}}$, including $ {{1}} $ itself. {{0}} " +
      "For testing purpose, some text to see how the pop up of the input field/s affects the text below.",
    fdTooFew: "You have selected too few nodes.",
    fdWrong: "You have selected wrong nodes.",
    fdParse: "Error parsing input.",
  },
  de: {
    name: "Graph-Knoten-Eingabefrage",
    description: "Wähle bestimmte Knoten aus.",
    text: "Wähle alle Knoten aus, die von Knoten ${{1}}$ aus erreichbar sind, einschließlich $ {{1}} $ selbst. {{0}}",
    fdTooFew: "Du hast zu wenige Knoten ausgewählt.",
    fdWrong: "Du hast falsche Knoten ausgewählt.",
    fdParse: "Fehler beim Parsen der Eingabe.",
  },
}

/**
 * This question generator generates a simple multiple choice question.
 */
export const DemoGraphNodeInput: QuestionGenerator = {
  id: "demogni",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["demo"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [],

  /**
   * Generates a new Graph Input question.
   *
   * @param lang The language of the question
   * @param parameters The parameters for the question. In this case none are used.
   * @param seed The seed for the random number generator
   * @returns A new MultiFreeText question
   */
  generate: (lang = "en", parameters, seed) => {
    const permaLink = serializeGeneratorCall({
      generator: DemoGraphNodeInput,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)

    let graph: Graph
    let reachableNodesIDs: number[]
    let startNode: Node
    do {
      graph = RandomGraph.grid(random, [6, 3], 0.6, "square-width-diagonals", null, false, false)
      graph.nodeDraggable = false
      graph.nodeClickType = "select"
      graph.inputFieldID = 6 // The ID of the input field for the node input, for example: ID 6

      startNode = random.choice(graph.nodes)
      reachableNodesIDs = reachableNodes(graph, startNode)
    } while (reachableNodesIDs.length > 14)

    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: DemoGraphNodeInput.name(lang),
      path: permaLink,
      text: t(translations, lang, "text", [graph.toMarkdown(), startNode.label!]),
      checkFormat: getCheckFormat(graph, lang),
      feedback: getFeedback(reachableNodesIDs, graph, lang),
    }

    return {
      question,
    }
  },
}

function getCheckFormat(graph: Graph, lang: Language): MultiFreeTextFormatFunction {
  return ({ text }, fieldID) => {
    const checkNode = checkNodeInput(text[fieldID], graph, lang)
    if (!checkNode.parsed) {
      return {
        valid: false,
        message: "- " + checkNode.messages.join("\n- "),
      }
    }
    return {
      valid: true,
    }
  }
}

function getFeedback(nodeIDs: number[], graph: Graph, lang: Language): MultiFreeTextFeedbackFunction {
  return ({ text }) => {
    const nodeTextField = text[nodeInputFieldID(6)]
    const parsedNodeTextField = checkNodeInput(nodeTextField, graph, lang)

    const newGraph = graph.clone()
    const nodeLabels: string[] = mapNumberToNodeLabel(nodeIDs)
    for (const nodeID of nodeIDs) {
      newGraph.setNodeGroup(nodeID, 1)
    }
    newGraph.nodeClickType = "selectupgrade"

    if (!("selected" in parsedNodeTextField)) {
      return {
        correct: false,
        feedbackText: t(translations, lang, "fdParse"),
        correctAnswer: newGraph.toMarkdown(),
      }
    }
    if (parsedNodeTextField.selected.length !== nodeLabels.length) {
      return {
        correct: false,
        feedbackText: t(translations, lang, "fdTooFew"),
        correctAnswer: newGraph.toMarkdown(),
      }
    }

    for (const expectedNode of nodeLabels) {
      if (!parsedNodeTextField.selected.includes(expectedNode)) {
        return {
          correct: false,
          feedbackText: t(translations, lang, "fdWrong"),
          correctAnswer: newGraph.toMarkdown(),
        }
      }
    }

    return {
      correct: true,
    }
  }
}

export function mapNumberToNodeLabel(elements: number[]): string[] {
  const nodeLabels: string[] = []
  for (const element of elements) {
    nodeLabels.push(getNodeLabel(element))
  }
  return nodeLabels
}

function reachableNodes(graph: Graph, startNode: Node): number[] {
  const startIndex = graph.nodes.findIndex((node) => node.label === startNode.label)
  if (startIndex === -1) throw new Error("Start node not found in graph")

  const queue: number[] = [startIndex]
  const seen: Set<number> = new Set<number>([startIndex])

  while (queue.length > 0) {
    const nextElement = queue.shift()
    if (nextElement === undefined) continue

    const neighbors = graph.getNeighbors(nextElement)
    for (const neighbor of neighbors) {
      const neighborIndex = neighbor.source === nextElement ? neighbor.target : neighbor.source
      if (!seen.has(neighborIndex)) {
        seen.add(neighborIndex)
        queue.push(neighborIndex)
      }
    }
  }

  return Array.from(seen)
}
