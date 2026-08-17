import type { Language } from "@shared/api/Language"
import {
  minimalMultipleChoiceFeedback,
  type FreeTextAnswer,
  type FreeTextFeedback,
  type FreeTextQuestion,
  type MatchingFeedback,
  type MatchingFeedbackFunction,
  type MatchingQuestion,
  type MultipleChoiceAnswer,
  type QuestionGenerator,
} from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import Random from "@shared/utils/random"
import { t, tFunctional } from "@shared/utils/translations"
import { generateConfounder, parseLatexSet, type Domain, type SetTemplate } from "./helpers"
import { templates } from "./templates"
import { translations } from "./translations"

const maxMatchSize = 8

export const SetBuilderQuestion: QuestionGenerator = {
  id: "setbuild",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["dismod", "sets"],
  languages: ["en", "de"],
  license: "MIT",
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["match", "freetext"],
    },
  ],

  generate: (lang, parameters, seed) => {
    const path = serializeGeneratorCall({ generator: SetBuilderQuestion, lang, parameters, seed })
    const variant = parameters.variant as "match" | "freetext"
    const random = new Random(seed)

    switch (variant) {
      case "match":
        return generateMatchVariant(lang, path, random)
      case "freetext":
        return generateFreeTextVariant(lang, path, random)
      default:
        throw new Error("Unknown variant")
    }
  },
}

/* -------------------------------------------------------------------------- */
/*  MATCHING VARIANT                                                          */
/* -------------------------------------------------------------------------- */

function buildMismatchTable(
  lang: Language,
  fixedItems: string[],
  shuffledAnswers: string[],
  userChoice: number[],
  correctMapping: number[],
): string {
  const rows: string[] = []

  for (let i = 0; i < fixedItems.length; i++) {
    const userIdx = userChoice[i]
    const correctIdx = correctMapping[i]

    if (userIdx === correctIdx) continue

    const correct = shuffledAnswers[correctIdx]

    rows.push(`| ${fixedItems[i]} | ${correct} |`)
  }

  if (rows.length === 0) return ""

  return [
    `| ${t(translations, lang, "expression")} | ${t(translations, lang, "answer")} |`,
    "|:---|:---|",
    ...rows,
    "",
  ].join("\n")
}

function matchingRowFeedback(correctMapping: number[], base: MatchingFeedbackFunction) {
  return async (answer: MultipleChoiceAnswer): Promise<MatchingFeedback> => {
    const result = await Promise.resolve(base(answer))
    const rowCorrectness = correctMapping.map((c, i) => answer.choice[i] === c)
    return { ...result, rowCorrectness }
  }
}

function generateMatchVariant(lang: Language, path: string, random: Random) {
  const nSets = random.int(4, 5)
  const fixed: string[] = []
  const movable: { latex: string; template: SetTemplate }[] = []

  // retry until enough valid sets are generated
  while (fixed.length < nSets) {
    const template = random.choice(templates)
    const domain: Domain = random.choice(["N", "Z"])
    const param = template.paramRange(random)

    // generate once and share between build/labels
    const cfg = template.generateConfig(domain, param, random)

    const elements = template.build(domain, param, cfg)
    if (elements.length === 0) continue

    // full explicit set, sorted and deduped
    const elementsSorted = Array.from(new Set(elements)).sort((a, b) => a - b)

    // skip sets that would be too large for matching
    if (elementsSorted.length > maxMatchSize) continue

    const explicit = `$\\{ ${elementsSorted.join(", ")} \\}$`
    if (movable.some((m) => m.latex === explicit)) continue

    const variants = template.labels(lang, domain, param, cfg)
    const label = `\\[${random.choice(variants)}\\]`

    fixed.push(label)
    movable.push({ latex: explicit, template })
  }

  // shuffle correct answers
  let movableShuffled = random.shuffle([...movable])

  // add confounders (0–2 wrong answers)
  const nConfounders = random.int(0, 2)
  const confounders: { latex: string; template: SetTemplate }[] = []

  let tries = 0
  while (confounders.length < nConfounders && tries < 50) {
    tries++

    const base = random.choice(movable)
    const nums = parseLatexSet(base.latex)
    if (nums.length < 2) continue

    const result = generateConfounder(nums, base.template, random)
    if (!result) continue

    //const { strategy, values } = result
    const { values } = result
    const unique = Array.from(new Set(values)).sort((a, b) => a - b)

    if (unique.length === 0) continue

    const fakeLatex = `$\\{ ${unique.join(", ")} \\}$`

    if (movable.some((m) => m.latex === fakeLatex)) continue
    if (confounders.some((c) => c.latex === fakeLatex)) continue

    // console.debug("[setbuilder confounder]", {
    //   strategy,
    //   base: base.latex,
    //   generated: fakeLatex,
    // })

    confounders.push({ latex: fakeLatex, template: base.template })
  }

  movableShuffled = [...movableShuffled, ...confounders]

  const solution = movable.map((m) => movableShuffled.findIndex((x) => x.latex === m.latex))

  const baseFeedback = minimalMultipleChoiceFeedback({
    correctAnswerIndex: solution,
    sorting: true,
  })

  const feedback: MatchingFeedbackFunction = async (answer) => {
    const base = await matchingRowFeedback(solution, baseFeedback)(answer)
    const table = buildMismatchTable(
      lang,
      fixed,
      movableShuffled.map((m) => m.latex),
      answer.choice,
      solution,
    )

    return {
      ...base,
      correctAnswer: base.correct ? undefined : table,
    }
  }

  const question: MatchingQuestion = {
    type: "MatchingQuestion",
    name: SetBuilderQuestion.name(lang),
    path,
    text: t(translations, lang, "match"),
    fixedItems: fixed,
    answers: movableShuffled.map((m) => m.latex),
    feedback,
    columns: 2,
    fillOutAll: true,
  }

  return { question }
}

/* -------------------------------------------------------------------------- */
/*  FREETEXT VARIANT                                                          */
/* -------------------------------------------------------------------------- */

function generateFreeTextVariant(lang: Language, path: string, random: Random) {
  const template = random.choice(templates)
  const dom: Domain = random.choice(["N", "Z"])
  const param = template.paramRange(random)

  const cfg = template.generateConfig(dom, param, random)
  const elements = template.build(dom, param, cfg)

  const sorted = Array.from(new Set(elements)).sort((a, b) => a - b)
  const correctSet = new Set(sorted)
  const expression = random.choice(template.labels(lang, dom, param, cfg))

  // also accept negative integers
  const checkFormat = (a: FreeTextAnswer) => {
    const input = a.text.trim()
    if (input === "") return { valid: false }
    const isValid = /^\{\s*(-?\d+(\s*,\s*-?\d+)*)?\s*\}$/.test(input)
    return isValid ? { valid: true } : { valid: false, message: t(translations, lang, "checkFormat") }
  }

  const feedback = (a: FreeTextAnswer): FreeTextFeedback => {
    const trimmed = a.text.trim()
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
      return { correct: false, correctAnswer: `$\\{ ${sorted.join(", ")} \\}$` }
    }
    const inside = trimmed.slice(1, -1).trim()
    if (inside === "") {
      return { correct: correctSet.size === 0, correctAnswer: `$\\{ ${sorted.join(", ")} \\}$` }
    }

    const user = inside
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((x) => !isNaN(x))

    const correct = user.length === correctSet.size && [...correctSet].every((x) => user.includes(x))
    return { correct, correctAnswer: `$\\{ ${sorted.join(", ")} \\}$` }
  }

  const question: FreeTextQuestion = {
    type: "FreeTextQuestion",
    name: t(translations, lang, "name"),
    path,
    text: `${t(translations, lang, "free")}\\[${expression}\\]`,
    prompt: "",
    checkFormat,
    feedback,
    typingAid: [
      { text: "{", input: "{", label: "{" },
      { text: "}", input: "}", label: "}" },
      { text: ",", input: ",", label: "," },
    ],
    bottomText: t(translations, lang, "typingAidExplanation"),
  }

  return { question }
}

export { translations } from "./translations"
