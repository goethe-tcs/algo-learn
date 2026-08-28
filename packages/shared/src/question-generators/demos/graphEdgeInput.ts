import type { Language } from "@shared/api/Language.ts"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextFormatFunction,
  MultiFreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import { edgeInputFieldID, RandomGraph, type Graph, type Node } from "@shared/utils/graph.ts"
import { checkEdgeInput } from "@shared/utils/graphInput.ts"
import Random from "@shared/utils/random"
import { t, tFunctional, type Translations } from "@shared/utils/translations"

/**
 * All displayed text goes into the translation object.
 * Include at least english and german.
 */
const translations: Translations = {
  en: {
    name: "Graph Edge Input Question",
    description: "Select all edges of a path.",
    text: "Select all edges on a simple path starting from node $ {{1}}$ reaching node $ {{2}}$. {{0}}",
    fdParse: "There has been an error parsing your input.",
    fdPath: "Your answer is not a simple path or does not lead to the desired end-node.",
  },
  de: {
    name: "Graph-Kanten-Eingabefrage",
    description: "Wähle alle Kanten eines Pfads aus.",
    text: "Wähle alle Kanten auf einem einfachen Pfad aus, der von Knoten $ {{1}}$ startet und Knoten $ {{2}}$ erreicht. {{0}}",
    fdParse: "Es gab einen Fehler beim Parsen deiner Eingabe.",
    fdPath: "Deine Antwort ist kein einfacher Pfad oder führt nicht zum gewünschten Endknoten.",
  },
}

/**
 * This question generator generates a simple multifreetext question
 * to show the graph edge input field feature.
 */
export const DemoGraphEdgeInput: QuestionGenerator = {
  id: "demogei",
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
      generator: DemoGraphEdgeInput,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)

    let graph: Graph
    let startNode: Node
    let bfsNodePaths: Record<string, Node[]>
    do {
      graph = RandomGraph.grid(random, [6, 3], 0.6, "square-width-diagonals", null, false, false)
      graph.nodeDraggable = false
      graph.edgeClickType = "select"
      graph.inputFieldID = 1

      startNode = random.choice(graph.nodes)
      bfsNodePaths = bfs(startNode, graph)
    } while (Object.entries(bfsNodePaths).length > 14 || Object.entries(bfsNodePaths).length <= 2)

    const endNode = random.choice(
      Object.entries(bfsNodePaths).filter(([label]) => label !== startNode.label!),
    )
    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: DemoGraphEdgeInput.name(lang),
      path: permaLink,
      text: t(translations, lang, "text", [graph.toMarkdown(), startNode.label!, endNode[0]]),
      checkFormat: getCheckFormat(graph, lang),
      feedback: getFeedback(startNode.label!, endNode, graph, lang),
    }

    return {
      question,
    }
  },
}

/**
 * Simple check format.
 * Most work done by the external function `checkEdgeInput`.
 * @param graph
 * @param lang
 */
function getCheckFormat(graph: Graph, lang: Language): MultiFreeTextFormatFunction {
  return ({ text }, fieldID) => {
    const edgeCheck = checkEdgeInput(text[fieldID], graph, lang)
    if (!edgeCheck.parsed) {
      return {
        valid: false,
        message: "- " + edgeCheck.messages.join("\n- "),
      }
    }
    return {
      valid: true,
    }
  }
}

/**
 * Feedback function.
 * Parsing done by the external function `checkEdgeInput`.

 * @param startNode
 * @param endNodePath - Tuple of end node label and path (nodes) to it
 * @param graph
 * @param lang
 */
function getFeedback(
  startNode: string,
  endNodePath: [string, Node[]],
  graph: Graph,
  lang: Language,
): MultiFreeTextFeedbackFunction {
  return ({ text }) => {
    const edgeInput = checkEdgeInput(text[edgeInputFieldID(1)], graph, lang)
    graph.edgeClickType = "selectupgrade"
    graph.nodeClickType = "none"
    // first remove all highlighting
    for (const edge of graph.edges.flat()) {
      graph.setEdgeGroup(edge.source, edge.target, null)
    }
    // add the correct path highlighting
    for (let i = 1; i < endNodePath[1].length; i++) {
      const node1 = graph.nodes.findIndex((node) => node.label! === endNodePath[1][i - 1].label)
      const node2 = graph.nodes.findIndex((node) => node.label! === endNodePath[1][i].label)
      graph.setEdgeGroup(node1, node2, 1)
    }
    if (!edgeInput.parsed) {
      return {
        correct: false,
        feedbackText: t(translations, lang, "fdParse"),
        correctAnswer: graph.toMarkdown(),
      }
    }
    if ("selected" in edgeInput) {
      const simplePath = isSimplePath(edgeInput.selected, startNode, endNodePath[0])
      if (!simplePath) {
        return {
          correct: false,
          feedbackText: t(translations, lang, "fdPath"),
          correctAnswer: graph.toMarkdown(),
        }
      }
    }

    return {
      correct: true,
    }
  }
}

/**
 * Check if the given edges form a simple path from startNode to endNode.
 * @param edges
 * @param startNode
 * @param endNode
 */
function isSimplePath(edges: [string, string][], startNode: string, endNode: string): boolean {
  const adjacencyList = new Map<string, Set<string>>()

  // Build adjacency list
  for (const [a, b] of edges) {
    if (!adjacencyList.has(a)) adjacencyList.set(a, new Set())
    if (!adjacencyList.has(b)) adjacencyList.set(b, new Set())
    adjacencyList.get(a)!.add(b)
    adjacencyList.get(b)!.add(a)
  }

  const visited = new Set<string>()
  let current = startNode

  while (visited.size < edges.length + 1) {
    visited.add(current)

    if (current === endNode) return visited.size === edges.length + 1

    // Get the next node
    const neighbors = adjacencyList.get(current)
    if (!neighbors) return false

    // Find an unvisited neighbor
    let nextNode: string | null = null
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        nextNode = neighbor
        break
      }
    }

    if (!nextNode) return false // No valid next move
    current = nextNode
  }

  return false
}

/**
 * Quick and dirty BFS to find all paths from the start node.
 * @param startNode
 * @param graph
 */
function bfs(startNode: Node, graph: Graph): Record<string, Node[]> {
  const queue: Node[] = [startNode]
  const visited: Set<Node> = new Set()
  const paths: Record<string, Node[]> = {}

  paths[startNode.label ?? "start"] = [startNode]
  visited.add(startNode)

  while (queue.length > 0) {
    const current = queue.shift()!

    // Find neighbors
    for (const edge of graph.edges.flat()) {
      const neighbor =
        graph.nodes[edge.source].label! === current.label!
          ? graph.nodes.find((n) => n.label === graph.nodes[edge.target].label!)
          : graph.nodes[edge.target].label! === current.label!
            ? graph.nodes.find((n) => n.label === graph.nodes[edge.source].label!)
            : null

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
        paths[neighbor.label ?? "unknown"] = [...paths[current.label ?? "start"], neighbor]
      }
    }
  }

  return paths
}
