import type {
  MultipleChoiceFeedbackFunction,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import Random from "@shared/utils/random"
import { t, tFunctional, type Translations } from "@shared/utils/translations"
import type { Automaton } from "./generate/automaton"
import { generateNFA } from "./generate/automatonGenerator"
import {
  convertNFAtoDFA,
  generateWords,
  minimizeDFA,
  writeAutomatonDefinition,
} from "./generate/automatonUtil"

const translations: Translations = {
  en: {
    name: "Congruence of Words",
    description:
      "Determine if two words are congruent with respect to the language induced by finite automata.",
    sizeautomaton: "Size of the automaton",
    viewpoint: "Viewpoint for equivalence",
    prompt: "Are the following words {{variantLabel}}",
    yesMyhill: "Yes, ${{word1}} \\mathrel{R_{L(A)}} {{word2}}$",
    noMyhill: "No, ${{word1}} \\not\\mathrel{R_{L(A)}} {{word2}}$",
    yesMonoid: "Yes, ${{word1}} \\equiv_{L(A)} {{word2}}$",
    noMonoid: "No, ${{word1}} \\not\\equiv_{L(A)} {{word2}}$",
    variantMyhill:
      "equivalent under the Myhill-Nerode congruence $\\mathrel{R_{L(A)}}$? $\\\\$" +
      "(i.e., $\\forall x \\in \\Sigma^*: {{word1}}x \\in L(A) \\Leftrightarrow {{word2}}x \\in L(A)$)",
    variantMonoid:
      "syntactically congruent with respect to $L(\\mathcal{A})$? $\\\\$" +
      "(i.e., $\\forall x,y \\in \\Sigma^*: x{{word1}}y \\in L(A) \\Leftrightarrow x{{word2}}y \\in L(A)$)",
    fddeflet: `Let $\\mathcal{A}' = (Q', \\Sigma, \\delta', {{0}}, F')$ be the minimized DFA with $\\\\$`,
    fddedelta: "and $\\delta$ is defined by the following transition table:",
    traceMyhill: `Trace of $ {{0}}$ and $ {{1}}$ from the start state $ {{2}}$:`,
    traceMonoid: `Trace of $ {{0}}$ and $ {{1}}$ from all states:`,
    allSameMyhill1:
      "Since both words behave the same from the start state in the minimal DFA, they are **Myhill-Nerode equivalent**.",
    allSameMyhill2: `Since the words behave differently from the start state in the minimal DFA 
             ($\\hat{\\delta}'({{0}}, {{1}}) = {{2}}$, but 
             $\\hat{\\delta}'({{0}}, {{3}}) = {{4}}$), 
             they are **not Myhill-Nerode equivalent**.`,
    allSameMonoid1:
      "Since both words behave the same from all states in the minimal DFA, they are **syntactically congruent**.",
    allSameMonoid2: `Since the words behave differently from at least one state 
          (z.B. $\\hat{\\delta}'({{0}}, {{1}}) = {{2}}$, but 
             $\\hat{\\delta}'({{0}}, {{3}}) = {{4}}$) in the minimal DFA, 
             they are **not syntactically congruent**.`,
  },
  de: {
    name: "Kongruenz von Wörtern",
    description:
      "Bestimme, ob zwei Wörter bzgl. der von endlichen Automaten induzierten Sprache kongruent sind.",
    sizeautomaton: "Größe des Automaten",
    viewpoint: "Perspektive der Äquivalenz",
    prompt: "Sind diese Wörter {{variantLabel}}",
    yesMyhill: "Ja, ${{word1}} \\mathrel{R_{L(A)}} {{word2}}$",
    noMyhill: "Nein, ${{word1}} \\not\\mathrel{R_{L(A)}} {{word2}}$",
    yesMonoid: "Ja, ${{word1}} \\equiv_{L(A)} {{word2}}$",
    noMonoid: "Nein, ${{word1}} \\not\\equiv_{L(A)} {{word2}}$",
    variantMyhill:
      "äquivalent unter der Myhill-Nerode-Kongruenz $\\mathrel{R_{L(A)}}$? $\\\\$" +
      "(d.h. $\\forall x \\in \\Sigma^*: {{word1}}x \\in L(A) \\Leftrightarrow {{word2}}x \\in L(A)$)",
    variantMonoid:
      "syntaktisch kongruent bzgl. $L(\\mathcal{A})$? $\\\\$" +
      "(d.h. $\\forall x,y \\in \\Sigma^*: x{{word1}}y \\in L(A) \\Leftrightarrow x{{word2}}y \\in L(A)$)",
    fddeflet: `Sei $\\mathcal{A}' = (Q', \\Sigma, \\delta', {{0}}, F')$ der minimierte DFA mit $\\\\$`,
    fddedelta: "und $\\delta$ ist über die folgende Übergangstabelle definiert:",
    traceMyhill: `Anwendung von $ {{0}}$ und $ {{1}}$ auf den Startzustand $ {{2}}$:`,
    traceMonoid: `Anwendung von $ {{0}}$ und $ {{1}}$ auf alle Zustände:`,
    allSameMyhill1:
      "Da sich beide Wörter vom Startzustand aus im minimalen DFA gleich verhalten, sind sie **Myhill-Nerode-äquivalent**.",
    allSameMyhill2: `Da sich die Wörter vom Startzustand aus im minimalen DFA unterschiedlich verhalten 
             ($\\hat{\\delta}'({{0}}, {{1}}) = {{2}}$, aber 
             $\\hat{\\delta}'({{0}}, {{3}}) = {{4}}$), 
             sind sie **nicht Myhill-Nerode-äquivalent**.`,
    allSameMonoid1:
      "Da sich beide Wörter von allen Zuständen aus im minimalen DFA gleich verhalten, sind sie **syntaktisch kongruent**.",
    allSameMonoid2: `Da sich die Wörter von mindestens einem Zustand
          (e.g. $\\hat{\\delta}'({{0}}, {{1}}) = {{2}}$, aber 
             $\\hat{\\delta}'({{0}}, {{3}}) = {{4}}$) im minimalen DFA unterschiedlich verhalten, 
             sind sie **nicht syntaktisch kongruent**.`,
  },
}

// simulate word from arbitrary state
function simulateFrom(dfa: Automaton, start: string, word: string): string | undefined {
  let current = start
  for (const symbol of word) {
    const node = dfa.nodes.find((n) => n.label === current)
    if (!node) return undefined
    const edge = dfa.getOutgoingEdges(node).find((e) => e.value?.toString() === symbol)
    if (!edge) return undefined
    current = dfa.nodes[edge.target]?.label ?? ""
  }
  return current
}

// checks if words behave the same from a given state
function behavesSameFromState(dfa: Automaton, state: string, word1: string, word2: string): boolean {
  return simulateFrom(dfa, state, word1) === simulateFrom(dfa, state, word2)
}

export const Congruence: QuestionGenerator = {
  id: "congruence",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  license: "MIT",
  tags: ["dfa", "nfa", "equivalence", "myhill-nerode", "syntactic monoid"],
  languages: ["en", "de"],
  expectedParameters: [
    {
      name: "size",
      type: "integer",
      min: 3,
      max: 6,
      description: tFunctional(translations, "sizeautomaton"),
    },
    {
      name: "variant",
      type: "string",
      allowedValues: ["myhill-nerode", "syntactic-monoid"],
      description: tFunctional(translations, "viewpoint"),
    },
  ],

  generate(lang, parameters, seed) {
    const random = new Random(seed)
    const size = parameters.size as number
    const variant = parameters.variant as "myhill-nerode" | "syntactic-monoid"
    const alphabet = ["0", "1"]

    const nfa = generateNFA(random, size, alphabet, 0.5, 0.2, 0, 0.3, true)
    const dfa = minimizeDFA(convertNFAtoDFA(nfa, alphabet), alphabet)

    const [word1, word2] = generateWords(random, 2, 2, 4, alphabet)

    const correct =
      variant === "myhill-nerode"
        ? behavesSameFromState(dfa, dfa.getStartNodes()[0]?.label ?? "", word1, word2)
        : dfa.nodes.every((n) => behavesSameFromState(dfa, n.label!, word1, word2))

    const text = [
      writeAutomatonDefinition(lang, nfa, alphabet),
      t(translations, lang, "prompt", {
        variantLabel: t(
          translations,
          lang,
          variant === "myhill-nerode" ? "variantMyhill" : "variantMonoid",
          {
            word1,
            word2,
          },
        ),
      }),
    ].join(" $\\\\$ ")

    const answers = [
      {
        key: "yes",
        element: t(translations, lang, variant === "myhill-nerode" ? "yesMyhill" : "yesMonoid", {
          word1,
          word2,
        }),
        correct,
      },
      {
        key: "no",
        element: t(translations, lang, variant === "myhill-nerode" ? "noMyhill" : "noMonoid", {
          word1,
          word2,
        }),
        correct: !correct,
      },
    ]

    const question: MultipleChoiceQuestion = {
      type: "MultipleChoiceQuestion",
      name: Congruence.name(lang),
      path: serializeGeneratorCall({ generator: Congruence, lang, parameters, seed }),
      text,
      allowMultiple: false,
      answers: answers.map((a) => a.element),
      feedback: getCongruenceFeedbackFunction(
        variant,
        dfa,
        word1,
        word2,
        alphabet,
        answers.findIndex((a) => a.correct),
        lang,
      ),
    }

    return { question }
  },
}

function getCongruenceFeedbackFunction(
  variant: "myhill-nerode" | "syntactic-monoid",
  dfa: Automaton,
  word1: string,
  word2: string,
  alphabet: string[],
  correctIndex: number,
  lang: "en" | "de",
): MultipleChoiceFeedbackFunction {
  return ({ choice }) => {
    const selectedIndex = choice[0]
    const correct = selectedIndex === correctIndex

    const start = dfa.getStartNodes()[0]?.label ?? ""
    const accepting = dfa
      .getEndNodes()
      .map((n) => `${n.label}`)
      .join(", ")
    const states = dfa.nodes.map((n) => `${n.label}`).join(", ")

    const definition = [
      t(translations, lang, "fddeflet", [start]),
      `$Q' = \\{ ${states} \\}$, $\\\\$`,
      `$F' = \\{ ${accepting} \\}$,$\\\\$`,
      t(translations, lang, "fddedelta"),
      `| $q \\in Q'$ | ${alphabet.map((a) => `$${a}$`).join(" | ")} |`,
      `|------------|${alphabet.map(() => "------").join("|")}|`,
      ...dfa.nodes.map((node) => {
        const row = [node.label!]
        for (const a of alphabet) {
          const edge = dfa.getOutgoingEdges(node).find((e) => e.value?.toString() === a)
          const target = edge ? `${dfa.nodes[edge.target]?.label ?? "$\\emptyset$"}` : "$\\emptyset$"
          row.push(target)
        }
        return `| $${row.join("$ | $")}$ |`
      }),
    ]

    const traceRows: string[] = []
    let allSame = true
    let firstDifference: { state: string; w1: string; w2: string } | null = null

    const statesToTrace =
      variant === "myhill-nerode"
        ? dfa
            .getStartNodes()
            .map((n) => n.label!)
            .slice(0, 1)
        : dfa.nodes.map((n) => n.label!)

    for (const from of statesToTrace) {
      const trace1 = simulateFrom(dfa, from, word1) ?? "$\\emptyset$"
      const trace2 = simulateFrom(dfa, from, word2) ?? "$\\emptyset$"
      if (trace1 !== trace2) {
        allSame = false
        if (!firstDifference) {
          firstDifference = { state: from, w1: trace1, w2: trace2 }
        }
      }
      traceRows.push(`| $${from}$ | $${trace1}$ | $${trace2}$ |`)
    }

    const traceBlock = [
      variant === "myhill-nerode"
        ? t(translations, lang, "traceMyhill", [word1, word2, start])
        : t(translations, lang, "traceMonoid", [word1, word2]),

      `| $q \\in Q'$ | $\\delta'(q, ${word1})$ | $\\delta'(q, ${word2})$ |`,
      "|------------|----------------------|----------------------|",

      ...traceRows,

      allSame
        ? variant === "myhill-nerode"
          ? t(translations, lang, "allSameMyhill1")
          : t(translations, lang, "allSameMonoid1")
        : variant === "myhill-nerode"
          ? t(translations, lang, "allSameMyhill2", [
              start,
              word1,
              simulateFrom(dfa, start, word1) ?? "\\emptyset",
              word2,
              simulateFrom(dfa, start, word2) ?? "\\emptyset",
            ])
          : t(translations, lang, "allSameMonoid2", [
              firstDifference?.state ?? "",
              word1,
              firstDifference?.w1 ?? "\\emptyset",
              word2,
              firstDifference?.w2 ?? "\\emptyset",
            ]),
    ]

    return {
      correct,
      correctChoice: [correctIndex],
      feedbackText: [...definition, ...traceBlock].join("\n"),
    }
  }
}
