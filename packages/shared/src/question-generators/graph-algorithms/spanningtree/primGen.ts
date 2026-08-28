import type { Language } from "@shared/api/Language.ts"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextFormatFunction,
  MultiFreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { computeAllMST } from "@shared/question-generators/graph-algorithms/spanningtree/primAlgo.ts"
import { RandomGraph, type Graph, type Node } from "@shared/utils/graph.ts"
import { checkNodeInput } from "@shared/utils/graphInput.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Prims Algorithm",
    description: "Correctly execute the Prims algorithm",
    task: `Given the graph $G$: {{0}} 
    Provide the order in which Prims algorithm visits the nodes, starting at node $ {{1}} $:
    {{primorder#NL###below}}`,
    missing: "*({{0}} nodes missing)*",
    param_size: "Size of the graph.",
  },
  de: {
    name: "Prims Algorithmus",
    description: "Führe Prims Algorithmus korrekt aus",
    task: `Gegeben ist der Graph $G$: {{0}} 
    Bestimme die Reihenfolge, in der der Prims-Algorithmus die Knoten besucht, beginnend bei Knoten $ {{1}} $:
    {{primorder#NL###below}}`,
    missing: "*({{0}} Knoten fehlen)*",
    param_size: "Größe des Graphen.",
  },
}

export const PrimOrder: QuestionGenerator = {
  id: "primorder",
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
      generator: PrimOrder,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)
    const size = parameters.size as number

    // Maximum of 26 nodes allowed
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
    G.nodeClickType = "select"
    const startNode = random.choice(G.nodes)
    const primResult = computeAllMST(G, startNode)

    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: PrimOrder.name(lang),
      path: permaLink,
      fillOutAll: true,
      text: t(translations, lang, "task", [G.toMarkdown(), startNode.label!]),
      checkFormat: getCheckFormat(G, lang),
      feedback: getFeedback(
        primResult.map((x) => x.nodes),
        G,
        lang,
      ),
    }

    return { question }
  },
}

function inputTextNodeCheck(text: { [p: string]: string }, G: Graph, lang: Language) {
  let nodes = text["primorder"]
    .toUpperCase()
    .replace(/\s/g, "")
    .split("")
    .filter((x) => /[A-Z]/.test(x))

  nodes = nodes.filter(function (item, pos) {
    return nodes.indexOf(item) === pos
  })
  return checkNodeInput(nodes.join(";"), G, lang)
}

function getCheckFormat(G: Graph, lang: Language): MultiFreeTextFormatFunction {
  return ({ text }) => {
    const nodeCheck = inputTextNodeCheck(text, G, lang)
    if (!("selected" in nodeCheck)) {
      return { valid: false }
    }
    if (!nodeCheck.parsed) return { valid: false, message: nodeCheck.messages.join("; ") }

    const missingNodes = nodeCheck.selected.length === G.nodes.length
    return {
      valid: missingNodes,
      message:
        "$ " +
        nodeCheck.selected.join("$,$") +
        "$ " +
        (missingNodes
          ? ""
          : t(translations, lang, "missing", [(G.nodes.length - nodeCheck.selected.length).toString()])),
    }
  }
}

function getFeedback(allNodeOrder: Node[][], G: Graph, lang: Language): MultiFreeTextFeedbackFunction {
  return ({ text }) => {
    const nodeCheck = inputTextNodeCheck(text, G, lang)
    if (!("selected" in nodeCheck)) {
      return { correct: false }
    }
    if (!nodeCheck.parsed) {
      return {
        correct: false,
        correctAnswer: "$" + allNodeOrder[0].map((n) => n.label).join("$-$") + "$",
      }
    }
    let foundCorrectOrder = false
    for (const nodeOrder of allNodeOrder) {
      let isCorrect = true
      for (const [i, node] of nodeOrder.entries()) {
        if (node.label !== nodeCheck.selected[i]) {
          isCorrect = false
          break
        }
      }
      if (isCorrect) {
        foundCorrectOrder = true
        break
      }
    }
    if (!foundCorrectOrder) {
      return {
        correct: false,
        correctAnswer: "$" + allNodeOrder[0].map((n) => n.label).join("$-$") + "$",
      }
    }
    return {
      correct: true,
    }
  }
}
