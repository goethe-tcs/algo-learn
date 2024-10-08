import {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  FreeTextQuestion,
  minimalMultipleChoiceFeedback,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import {
  generateHeapsForChoiceQuestion,
  generateNeighbourOptions,
} from "@shared/question-generators/heap/utils/utilsGenerate.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, Translations } from "@shared/utils/translations.ts"

const translationsHeapVerifying: Translations = {
  en: {
    name: "Heap-Verifying",
    description: "Verify basic heap properties",
    taskCorrectness:
      "Which of the following arrays satisfy all **Heap-Properties** for a **{{0}}-Heap**?",
    taskNeighbours:
      "We consider a **Heap** implemented as array $[1,\\dots,n]$. What is the index of the **{{0}}** of the element at **index {{1}}** in a *Heap*?",
    checkFormatPermutations: "Please only enter an Integer.",
  },
  de: {
    name: "Heap-Verständnis",
    description: "Überprüfe grundlegende Heap-Eigenschaften",
    taskCorrectness:
      "Welche der folgenden Arrays erfüllen alle **Heap-Eigenschaften** für einen **{{0}}-Heap**?",
    taskNeighbours:
      "Wir betrachten einen **Heap** der als Array $[1,\\dots,n]$ implementiert ist. Was ist der Index des **{{0}}** des Elements an **Index {{1}}* in einem *Heap*?",
    checkFormatPermutations: "Bitte etwas ganzzahliges eingeben.",
  },
}
const wordTranslations: Translations = {
  en: {
    maximal: "maximal",
    minimal: "minimal",
    parent: "parent",
    rightChild: "right child",
    leftChild: "left child",
  },
  de: {
    maximal: "maximale",
    minimal: "minimale",
    parent: "Elternknoten",
    rightChild: "rechten Kindes",
    leftChild: "linken Kindes",
  },
}
export const HeapVerifying: QuestionGenerator = {
  id: "heapverify",
  name: tFunctional(translationsHeapVerifying, "name"),
  description: tFunctional(translationsHeapVerifying, "description"),
  tags: ["heap", "priority-queue"],
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["correctness", "neighbours"],
    },
  ],

  generate: (lang = "en", parameters, seed) => {
    const permaLink = serializeGeneratorCall({
      generator: HeapVerifying,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)

    const variant: "correctness" | "proofs" = parameters.variant as "correctness" | "proofs"

    const heapType: "Max" | "Min" = random.choice(["Max", "Min"])

    const checkFormat: FreeTextFormatFunction = ({ text }) => {
      // check if the input is an integer
      text = text.trim()
      if (text === "") return { valid: false }
      if (!/^\d+$/.test(text)) {
        return {
          valid: false,
          message: t(translationsHeapVerifying, lang, "checkFormatPermutations"),
        }
      }
      return { valid: true }
    }

    let solution = -1
    const feedback: FreeTextFeedbackFunction = ({ text }) => {
      const cleanedText = text.trim()
      if (parseInt(cleanedText) !== solution) {
        return {
          correct: false,
          correctAnswer: solution.toString(),
        }
      }
      return { correct: true }
    }

    if (variant === "correctness") {
      const { heapStringTable, correctAnswerIndex } = generateHeapsForChoiceQuestion(heapType, random)

      const question: MultipleChoiceQuestion = {
        type: "MultipleChoiceQuestion",
        name: HeapVerifying.name(lang),
        path: permaLink,
        text: t(translationsHeapVerifying, lang, "taskCorrectness", [heapType]),
        answers: heapStringTable,
        feedback: minimalMultipleChoiceFeedback({ correctAnswerIndex }),
        allowMultiple: true,
      }
      return { question }
    } else {
      const { formula, text } = generateNeighbourOptions(random)
      const randomIndex = random.int(2, 50)

      solution = formula(randomIndex)
      const neighbourText = text.map((word) => t(wordTranslations, lang, word)).join(" ")

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapVerifying.name(lang),
        path: permaLink,
        text: t(translationsHeapVerifying, lang, "taskNeighbours", [
          neighbourText,
          randomIndex.toString(),
        ]),
        checkFormat,
        feedback,
      }
      return { question }
    }
  },
}
