import {
  minimalMultipleChoiceFeedback,
  type MultipleChoiceQuestion,
  type QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { kruskalAlgorithm } from "@shared/question-generators/graph-algorithms/spanningtree/kruskalAlgo.ts"
import { computeAllMST } from "@shared/question-generators/graph-algorithms/spanningtree/primAlgo.ts"
import { isSameEdge, RandomGraph, type Edge, type Graph } from "@shared/utils/graph.ts"
import { setEdgesGroup } from "@shared/utils/graphInput.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Identify Minimal Spanning Trees",
    description: "Decide which spanning trees are minimal.",
    task: "Select all graphs in which the highlighted spanning tree is a minimal spanning tree.",
    param_size: "The size of the graph",
  },
  de: {
    name: "Minimale Spannbäume erkennen",
    description: "Entscheiden Sie, welche Spannbäume minimal sind.",
    task: "Wählen Sie alle Graphen aus, in denen der hervorgehobene Spannbaum ein minimaler Spannbaum ist.",
    param_size: "Die Größe des Graphen",
  },
}

/**
 * A multiple choice question where the user has to select all graphs
 * in which the highlighted spanning tree is a minimal spanning tree.
 */
export const FindMinimalMST: QuestionGenerator = {
  id: "matchmst",
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
      generator: FindMinimalMST,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)
    const size = parameters.size as number

    const graphs = []
    for (let _ = 0; _ < 4; _++) {
      const G = RandomGraph.grid(
        random,
        [size, size],
        1,
        random.choice(["square", "square-width-diagonals", "triangle"]),
        "random",
        false,
        random.bool(),
      )
      G.edgeGroupMax = 2
      G.nodeDraggable = false
      G.edgeClickType = "selectupgrade"

      graphs.push(G)
    }
    const { correctIndices } = computeSpanningTrees(graphs, random)

    const question: MultipleChoiceQuestion = {
      type: "MultipleChoiceQuestion",
      name: FindMinimalMST.name(lang),
      allowMultiple: true,
      path: permaLink,
      text: t(translations, lang, "task"),
      answers: graphs.map((G) => G.toMarkdown()),
      feedback: minimalMultipleChoiceFeedback({ correctAnswerIndex: correctIndices }),
    }

    return {
      question,
    }
  },
}

/**
 * Computes spanning trees for the given graphs, modifying them in place.
 *
 * @param graphs
 * @param random
 *
 * @returns The indices of the graphs that have a correct MST
 */
function computeSpanningTrees(
  graphs: Graph[],
  random: Random,
): {
  correctIndices: number[]
} {
  const correctIndices: number[] = random.subset(
    Array.from({ length: graphs.length }, (_, i) => i),
    random.int(1, graphs.length - 1),
  )
  for (let i = 0; i < graphs.length; i++) {
    const G = graphs[i]
    if (correctIndices.includes(i)) {
      drawCorrectMST(G, random)
    } else {
      drawIncorrectMST(G, random)
    }
  }

  return {
    correctIndices,
  }
}

/**
 * Draws a correct MST on the given graph, either using Prim's or Kruskal's algorithm.
 * @param graph Modifies the graph in place
 * @param random
 */
function drawCorrectMST(graph: Graph, random: Random) {
  const MST = (
    random.bool()
      ? random.choice(computeAllMST(graph, random.choice(graph.nodes)))
      : kruskalAlgorithm(graph)
  ).mst
  setEdgesGroup(graph, MST, 1)
}

/**
 * Draws an incorrect MST on the given graph.
 * - creating a cycle in the MST
 * - missing an edge
 * - swapping an edge with a heavier edge
 * @param graph Modifies the graph in place
 * @param random
 */
function drawIncorrectMST(graph: Graph, random: Random) {
  const option = random.weightedChoice(["cycle", "missing", "heavier"], [1, 1, 3])
  switch (option) {
    case "cycle":
      createCycleMST(graph, random)
      break
    case "missing":
      createMissingMST(graph, random)
      break
    case "heavier":
      createHeavierMST(graph, random)
      break
    default:
      throw new Error(`Unknown option ${option}`)
  }
}

/**
 * Creates a cycle in the MST by adding an edge from the cycle found by Kruskal's algorithm,
 * or by adding a random edge if no cycle was found.
 * @param graph
 * @param random
 */
function createCycleMST(graph: Graph, random: Random) {
  const kruskalResult = kruskalAlgorithm(graph)
  const edges: Edge[] = kruskalResult.mst
  if (kruskalResult.cycle.length === 0) {
    let edge: Edge
    do {
      edge = random.choice(graph.edges.flat())
    } while (edges.some((x) => isSameEdge(x, edge)))
    edges.push(edge)
  } else {
    edges.push(random.choice(kruskalResult.cycle))
  }
  setEdgesGroup(graph, edges, 1)
}

/**
 * Creates a missing edge in the MST by removing an edge that is a bridge or connected to a leaf.
 * @param graph
 * @param random
 */
function createMissingMST(graph: Graph, random: Random) {
  const MST = (
    random.bool()
      ? random.choice(computeAllMST(graph, random.choice(graph.nodes)))
      : kruskalAlgorithm(graph)
  ).mst
  let edge: Edge
  if (random.bool(0.75)) {
    // remove an edge that is a bridge
    do {
      edge = random.choice(MST)
    } while (!isBridge(MST, edge))
  } else {
    // remove an edge that is connected to a leaf
    do {
      edge = random.choice(MST)
    } while (isBridge(MST, edge))
  }
  MST.splice(MST.indexOf(edge), 1)
  setEdgesGroup(graph, MST, 1)
}

/**
 * Creates a heavier edge in the MST by removing an edge and replacing it with a heavier edge
 * @param graph
 * @param random
 */
function createHeavierMST(graph: Graph, random: Random) {
  // Get a correct MST
  const MST = (
    random.bool()
      ? random.choice(computeAllMST(graph, random.choice(graph.nodes)))
      : kruskalAlgorithm(graph)
  ).mst

  const newMST = [...MST]

  // Pick a random edge to remove
  const edgeToReplace = random.choice(newMST)
  newMST.splice(newMST.indexOf(edgeToReplace), 1)

  // Find the two components after removal
  const visited = new Set<number>()
  const stack = [edgeToReplace.source]
  visited.add(edgeToReplace.source)
  while (stack.length > 0) {
    const node = stack.pop()!
    for (const e of newMST) {
      if (e.source === node && !visited.has(e.target)) {
        visited.add(e.target)
        stack.push(e.target)
      }
      if (e.target === node && !visited.has(e.source)) {
        visited.add(e.source)
        stack.push(e.source)
      }
    }
  }
  const compA = visited
  const compB = new Set(graph.nodes.map((_, i) => i).filter((i) => !compA.has(i)))

  // Find candidate edges crossing between compA and compB
  const candidates = graph.edges.flat().filter(
    (e) =>
      !newMST.some((x) => isSameEdge(x, e)) && // not already in MST
      ((compA.has(e.source) && compB.has(e.target)) || (compA.has(e.target) && compB.has(e.source))) &&
      (e.value ?? 1) > (edgeToReplace.value ?? 1), // heavier
  )

  // Step 3: Pick a replacement
  if (candidates.length > 0) {
    newMST.push(random.choice(candidates))
    setEdgesGroup(graph, newMST, 1)
  } else {
    // fallback, create either a cycle or a missing edge
    // all functions are modifying the graph in place
    if (random.bool()) {
      createCycleMST(graph, random)
    } else {
      createMissingMST(graph, random)
    }
  }
}

/**
 * Checks if the given edge is a bridge in the list of edges.
 * An edge is a bridge if its removal increases the number of connected components.
 * @param edges
 * @param edge
 */
function isBridge(edges: Edge[], edge: Edge): boolean {
  if (edges.length <= 1) return false

  let count = 0

  for (const e of edges) {
    if (isSameEdge(e, edge)) continue

    if (
      e.source === edge.source ||
      e.source === edge.target ||
      e.target === edge.source ||
      e.target === edge.target
    ) {
      count++
      if (count >= 2) return true
    }
  }

  return false
}
