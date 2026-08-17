import type { FreeTextQuestion, QuestionGenerator } from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import Random from "@shared/utils/random"
import { t, tFunctional, type Translations } from "@shared/utils/translations"
import { generateDFA, generateNFA } from "./generate/automatonGenerator"
import { convertNFAtoDFA, minimizeDFA, writeAutomatonDefinition } from "./generate/automatonUtil"

const translations: Translations = {
  en: {
    name: "Minimal DFA State Count",
    description: "Determine how many states the minimal DFA has.",
    prompt: "Number of states:",
    Question: "How many states does the minimal DFA equivalent to $\\mathcal{A}$ have?",
    typeautomaton: "Type of automaton",
    sizeautomaton: "Size of the automaton",
  },
  de: {
    name: "Minimale DFA Zustandsanzahl",
    description: "Bestimme wie viele Zustände der minimale DFA hat.",
    prompt: "Anzahl Zustände:",
    Question: "Wie viele Zustände hat der zu $\\mathcal{A}$ äquivalente minimale DFA?",
    typeautomaton: "Typ des Automaten",
    sizeautomaton: "Größe des Automaten",
  },
}

export const MinimalDFAStateCount: QuestionGenerator = {
  id: "famincount",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  license: "MIT",
  tags: ["dfa", "nfa", "minimization"],
  languages: ["en", "de"],
  expectedParameters: [
    {
      name: "type",
      type: "string",
      allowedValues: ["NFA", "DFA"],
      description: tFunctional(translations, "typeautomaton"),
    },
    {
      name: "size",
      type: "integer",
      min: 3,
      max: 6,
      description: tFunctional(translations, "sizeautomaton"),
    },
  ],

  generate(lang, parameters, seed) {
    const random = new Random(seed)
    const type = parameters.type as "NFA" | "DFA"
    const size = parameters.size as number
    const alphabet = ["0", "1"]

    const original =
      type === "NFA"
        ? generateNFA(random, size, alphabet, 0.5, 0.2, 0.1, 0.3, true)
        : generateDFA(random, size, alphabet, 0.2, true)

    const dfa = type === "NFA" ? convertNFAtoDFA(original, alphabet) : original
    const minimized = minimizeDFA(dfa, alphabet)
    const stateCount = minimized.nodes.length

    const automatonDescription = writeAutomatonDefinition(lang, original, alphabet)

    const text = [automatonDescription, "", t(translations, lang, "Question")].join(" $\\\\$ ")

    const path = serializeGeneratorCall({ generator: MinimalDFAStateCount, lang, parameters, seed })

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: MinimalDFAStateCount.name(lang),
      path,
      text,
      prompt: t(translations, lang, "prompt"),
      feedback({ text }) {
        const n = parseInt(text.trim())
        return {
          correct: n === stateCount,
          correctAnswer: stateCount.toString(),
        }
      },
      checkFormat({ text }) {
        const val = parseInt(text.trim())
        return {
          valid: !Number.isNaN(val),
          message: val.toString(),
        }
      },
    }

    return { question }
  },
}
