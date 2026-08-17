import type { Language } from "@shared/api/Language"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextFormatFunction,
  MultiFreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import Random from "@shared/utils/random"
import { t, tFunctional, type Translations } from "@shared/utils/translations"
import type { Automaton } from "./generate/automaton"
import { generateDFA } from "./generate/automatonGenerator"
import { writeAutomatonDefinition } from "./generate/automatonUtil"

const translations: Translations = {
  en: {
    name: "DFA Minimization Table",
    description: "Complete the minimization table to find equivalent and distinguishable states.",
    prompt:
      "Fill in the following minimization table to identify indistinguishable state pairs. \n" +
      ' - Mark all pairs $(q_i, q_j)\\in Q\\times Q$ where $q_i \\in F \\Leftrightarrow q_j \\notin F$, with an "x". \n' +
      " - Pairs $(q_i, q_j)$ distinguishable by some input $w \\in \\Sigma^*$ such that $\\delta(q_i, w) \\in F \\Leftrightarrow \\delta(q_j, w) \\notin F$, should be marked by the lexicographically shortest such distinguishing suffix $w$. \n" +
      " - Should no such $w$ exists, leave the field blank.",
    invalid: '"x", $w\\in\\Sigma^*$ or blank',
  },
  de: {
    description:
      "Fülle die Minimierungstabelle aus, um äquivalente und unterscheidbare Zustände zu finden.",
    prompt:
      "Fülle die Minimierungstabelle aus, um nicht unterscheidbare Zustandspaare zu identifizieren. \n" +
      ' - Markiere alle Paare $(q_i, q_j)\\in Q\\times Q$ mit $q_i \\in F \\Leftrightarrow q_j \\notin F$, mit einem "x". \n' +
      " - Paare, die durch ein Wort $w \\in \\Sigma^*$ unterscheidbar sind, sodass $\\delta(q_i, w) \\in F \\Leftrightarrow \\delta(q_j, w) \\notin F$, sollten durch das lexikografisch kürzeste solche Suffix $w$ markiert werden.\n" +
      " - Gibt es kein solches $w$, lasse das Feld leer.",
    invalid: '"x", $w\\in\\Sigma^*$ oder leer',
  },
}

function getStatePairs(states: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 1; i < states.length; i++) {
    for (let j = 0; j < i; j++) {
      pairs.push([states[i], states[j]])
    }
  }
  return pairs
}

function create2DArray<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(fill) as T[])
}

/**
 * Checks whether given suffix distinguishes two states and is minimal.
 */
function isValidMinimalSuffix(
  dfa: Automaton,
  fromStateA: string,
  fromStateB: string,
  suffix: string,
  accepting: Set<string>,
): boolean {
  if (!/^[01]+$/.test(suffix)) return false

  const simulate = (start: string, input: string): string | undefined => {
    let current = start
    for (const symbol of input) {
      const node = dfa.nodes.find((n) => n.label === current)
      if (!node) return undefined
      const edge = dfa.getOutgoingEdges(node).find((e) => e.value?.toString() === symbol)
      if (!edge) return undefined
      current = dfa.nodes[edge.target]?.label ?? ""
    }
    return current
  }

  const resultA = simulate(fromStateA, suffix)
  const resultB = simulate(fromStateB, suffix)
  const acceptsA = resultA !== undefined && accepting.has(resultA)
  const acceptsB = resultB !== undefined && accepting.has(resultB)

  if (acceptsA === acceptsB) return false

  // check if any prefix already distinguishes
  for (let i = 1; i < suffix.length; i++) {
    const prefix = suffix.slice(0, i)
    const prefixA = simulate(fromStateA, prefix)
    const prefixB = simulate(fromStateB, prefix)
    if (
      prefixA !== undefined &&
      prefixB !== undefined &&
      accepting.has(prefixA) !== accepting.has(prefixB)
    ) {
      return false
    }
  }

  return true
}

/**
 * Finds minimal suffix that distinguishes two states, or null if none exists.
 */
function findMinimalDistinguishingSuffix(
  dfa: Automaton,
  fromStateA: string,
  fromStateB: string,
  alphabet: string[],
  accepting: Set<string>,
): string | null {
  const queue: { a: string; b: string; path: string }[] = [{ a: fromStateA, b: fromStateB, path: "" }]
  const visited = new Set<string>()

  const isAccept = (s: string | undefined) => s !== undefined && accepting.has(s)

  while (queue.length) {
    const { a, b, path } = queue.shift()!
    const key = `${a},${b}`
    if (visited.has(key)) continue
    visited.add(key)

    const acceptsA = isAccept(a)
    const acceptsB = isAccept(b)
    if (acceptsA !== acceptsB) return path

    for (const symbol of alphabet) {
      const nextA = dfa
        .getOutgoingEdges(dfa.nodes.find((n) => n.label === a)!)
        .find((e) => e.value?.toString() === symbol)?.target
      const nextB = dfa
        .getOutgoingEdges(dfa.nodes.find((n) => n.label === b)!)
        .find((e) => e.value?.toString() === symbol)?.target

      const labelA = nextA !== undefined ? dfa.nodes[nextA]?.label : undefined
      const labelB = nextB !== undefined ? dfa.nodes[nextB]?.label : undefined

      if (labelA && labelB) {
        queue.push({ a: labelA, b: labelB, path: path + symbol })
      }
    }
  }

  return null
}

export const DFAMinimizationTable: QuestionGenerator = {
  id: "dfamintab",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  license: "MIT",
  languages: ["en", "de"],
  tags: ["dfa", "minimization", "table"],
  expectedParameters: [
    {
      name: "size",
      type: "integer",
      min: 4,
      max: 6,
    },
  ],

  generate(lang, parameters, seed) {
    const random = new Random(seed)
    const size = parameters.size as number
    const alphabet = ["0", "1"]

    const dfa = generateDFA(random, size, alphabet, 0.2, true)
    const states = dfa.nodes.map((n) => n.label!).filter((label): label is string => !!label)
    const pairs = getStatePairs(states)

    const dfaDescription = writeAutomatonDefinition(lang, dfa, alphabet)

    const header = `|     | ${states
      .slice(0, -1)
      .map((s) => `$${s}$`)
      .join(" | ")} |`
    const separator = `|${Array(states.length).fill("---").join("|")}|`

    const rows = states
      .map((row, i) => {
        if (i === 0) return null
        const cells = states.slice(0, i).map((col) => `{{${row}_${col}#OS-2#}}`)
        return `| $${row}$ | ${cells.join(" | ")} |`
      })
      .filter(Boolean)

    const question: MultiFreeTextQuestion = {
      type: "MultiFreeTextQuestion",
      name: DFAMinimizationTable.name(lang),
      path: serializeGeneratorCall({ generator: DFAMinimizationTable, lang, parameters, seed }),
      fillOutAll: false,
      text: [dfaDescription, "$\\\\$", t(translations, lang, "prompt"), header, separator, ...rows].join(
        "\n",
      ),
      checkFormat: getFormatFunction(lang),
      feedback: getFeedbackFunction(dfa, pairs, alphabet, states),
    }

    return { question }
  },
}

function getFormatFunction(lang: Language): MultiFreeTextFormatFunction {
  return ({ text }, fieldID) => {
    const value = text[fieldID]?.trim()
    if (value === undefined) return { valid: false, message: "" }
    if (value === "") return { valid: true, message: "" }
    return /^[01]+$/.test(value) || value.toLowerCase() === "x"
      ? { valid: true, message: "" }
      : { valid: false, message: t(translations, lang, "invalid") }
  }
}

function getFeedbackFunction(
  dfa: Automaton,
  pairs: [string, string][],
  alphabet: string[],
  states: string[],
): MultiFreeTextFeedbackFunction {
  const accepting = new Set<string>(
    dfa
      .getEndNodes()
      .map((n) => n.label!)
      .filter((l): l is string => !!l),
  )

  return ({ text }) => {
    let correct = true
    const n = states.length
    const table = create2DArray<string>(n, n, "")

    for (const [a, b] of pairs) {
      const field = `${a}_${b}`
      const userInput = text[field]?.trim() ?? ""
      const normalizedInput = userInput.toLowerCase() === "x" ? "x" : userInput
      const i = states.indexOf(a)
      const j = states.indexOf(b)

      if (accepting.has(a) !== accepting.has(b)) {
        // immediately distinguishable
        table[i][j] = normalizedInput === "x" ? "✅ x" : "❌ x"
        if (normalizedInput !== "x") correct = false
      } else {
        if (normalizedInput === "") {
          const valid = findMinimalDistinguishingSuffix(dfa, a, b, alphabet, accepting) === null
          if (valid) {
            table[i][j] = "✅"
          } else {
            correct = false
            const hint = findMinimalDistinguishingSuffix(dfa, a, b, alphabet, accepting)
            table[i][j] = hint ? `❌ $${hint}$` : "❌"
          }
        } else if (isValidMinimalSuffix(dfa, a, b, normalizedInput, accepting)) {
          table[i][j] = `✅ $${normalizedInput}$`
        } else {
          correct = false
          const hint = findMinimalDistinguishingSuffix(dfa, a, b, alphabet, accepting)
          table[i][j] = hint ? `❌ $${hint}$` : "❌"
        }
      }

      table[j][i] = table[i][j]
    }

    const header = `|     | ${states
      .slice(0, -1)
      .map((s) => `$${s}$`)
      .join(" | ")} |`
    const separator = `|${Array(states.length).fill("---").join("|")}|`
    const body = states
      .map((row, i) => {
        if (i === 0) return null
        const cells = states.slice(0, i).map((_, j) => table[i][j] || "")
        return `| $${row}$ | ${cells.join(" | ")} |`
      })
      .filter(Boolean)

    return {
      correct,
      correctAnswer: [header, separator, ...body].join("\n"),
    }
  }
}
