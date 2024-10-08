import {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  FreeTextQuestion,
  QuestionGenerator,
} from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { MaxHeap, MinHeap } from "@shared/question-generators/heap/heapMinMax.ts"
import { generateOperationSequence } from "@shared/question-generators/heap/utils/utilsGenerate.ts"
import { generateHeapOperationsFoundation } from "@shared/question-generators/heap/utils/utilsOperations.ts"
import { createArrayDisplayCodeBlock } from "@shared/utils/arrayDisplayCodeBlock.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, Translations } from "@shared/utils/translations.ts"

const translationHeapOperations: Translations = {
  en: {
    name: "Heap-Operations",
    description: "Determine the state of a Heap after various operations",
    taskInsert:
      "Consider a **{{0}}-Heap**. Initially the Heap is empty. Insert the elements in the given order: \\[{{1}}\\] Enter the final state of the Heap as an array.",
    taskExtract:
      "Consider a **{{0}}-Heap** that is given by the following array: {{1}} You call `Extract{{2}}` **{{3}}** times. Enter the final state of the Heap as an array.",
    taskBuild:
      "(Not included at the moment) Consider the following **Array**: {{0}} Enter the state of the Heap after **Build-{{1}}-Heap** on the above array.",
    taskCombine:
      "Consider the following sequence of operations, where a **number** represents **inserting** this number into the **{{1}}-Heap** and $*$ represents an `Extract{{1}}` operation. \\[{{0}}\\] Enter the final state of the Heap as an array. Initially the Heap is empty.",
    checkFormat: "Please only enter Integer seperated by commas.",
  },
  de: {
    name: "Heap-Operationen",
    description: "Bestimme den Zustand eines Heaps nach unterschiedlichen Operationen",
    taskInsert:
      "Betrachte einen **{{0}}-Heap**. Anfänglich ist der Heap leer. Du fügst die folgenden Elemente in gegebener Reihenfolge ein: \\[{{1}}\\] Gib den finalen Zustand des Heaps als Array an.",
    taskExtract:
      "Betrachte einen **{{0}}-Heap**, der durch das folgende Array gegeben ist: {{1}} Du rufst `Extract{{2}}` **{{3}}** mal auf. Gib den finalen Zustand des Heaps als Array an.",
    taskBuild:
      "(Not included at the moment) Betrachte das folgende Array: {{0}} Gib den Heap nach **Build-{{1}}-Heap** auf dem obigen Array an.",
    taskCombine:
      "Betrachte die folgende Sequenz von Operationen, wobei eine **Zahl** das **Einfügen** dieser Zahl in den **{{1}}-Heap** repräsentiert und $*$ eine `Extract{{1}}` Operation. \\[{{0}}\\] Gib den finalen Zustand des Heaps als Array an. Anfänglich ist der Heap leer.",
    checkFormat: "Bitte nur ganze Zahlen durch Komma getrennt eingeben.",
  },
}

export const HeapOperations: QuestionGenerator = {
  id: "heapops",
  name: tFunctional(translationHeapOperations, "name"),
  description: tFunctional(translationHeapOperations, "description"),
  tags: ["heap", "priority-queue"],
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["insert", "extract", "combine"],
    },
  ],

  generate: (lang = "en", parameters, seed) => {
    const permaLink = serializeGeneratorCall({
      generator: HeapOperations,
      lang,
      parameters,
      seed,
    })

    const random = new Random(seed)

    const variant = parameters.variant as "insert" | "extract" | "build" | "combine"

    let solutionHeap: MaxHeap | MinHeap
    const {
      heapElements,
      heapType,
      solutionHeap: solutionHeap_,
    } = generateHeapOperationsFoundation({ random })
    solutionHeap = solutionHeap_

    // TODO: replace this with future standard feedback and checkFormat functions from PR QuickFind
    const checkFormat: FreeTextFormatFunction = ({ text }) => {
      if (text.trim() === "") return { valid: false }

      // remove all whitespaces
      let cleanedText = text.replace(/\s/g, "")
      // remove brackets
      cleanedText = cleanedText.replace(/^\[/, "").replace(/\]$/, "")

      let heapInputTable = "\n"
      // test if every input is an integer
      for (const element of cleanedText.split(",")) {
        if (!/^\d+$/.test(element) && element.trim() !== "") {
          return {
            valid: false,
            message: t(translationHeapOperations, lang, "checkFormat"),
          }
        }
        heapInputTable += "|" + element
      }
      heapInputTable += "|\n"
      heapInputTable += "|---".repeat(cleanedText.split(",").length) + "|\n"

      return {
        valid: true,
        message: heapInputTable,
      }
    }

    const feedback: FreeTextFeedbackFunction = ({ text }) => {
      // remove every whitespace
      let cleanedText = text.replace(/\s/g, "")
      // remove brackets
      cleanedText = cleanedText.replace(/^\[/, "").replace(/\]$/, "")

      // remove every empty entry
      const userHeap = cleanedText
        .split(",")
        .filter((element) => element.trim() !== "")
        .map(Number)

      if (userHeap.toString() !== solutionHeap.toString()) {
        return {
          correct: false,
          correctAnswer: createArrayDisplayCodeBlock({
            array: ["-"].concat(solutionHeap.getHeap().map(String)),
          }),
        }
      }

      return {
        correct: true,
      }
    }

    if (variant === "insert") {
      for (const element of heapElements) {
        solutionHeap.insert(element)
      }

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapOperations.name(lang),
        path: permaLink,
        text: t(translationHeapOperations, lang, "taskInsert", [heapType, heapElements.toString()]),
        checkFormat,
        feedback,
      }
      return { question }
    } else if (variant === "extract") {
      for (const element of heapElements) {
        solutionHeap.insert(element)
      }
      const elementsTable = createArrayDisplayCodeBlock({
        array: ["-"].concat(solutionHeap.getHeap().map(String)),
      })

      const extractAmount = random.int(2, 3)
      for (let i = 0; i < extractAmount; i++) {
        if (solutionHeap instanceof MinHeap) {
          solutionHeap.extractMin()
        } else {
          solutionHeap.extractMax()
        }
      }

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapOperations.name(lang),
        path: permaLink,
        text: t(translationHeapOperations, lang, "taskExtract", [
          heapType,
          elementsTable,
          heapType,
          extractAmount.toString(),
        ]),
        checkFormat,
        feedback,
      }
      return { question }
    } else if (variant === "build") {
      const elementsTable = createArrayDisplayCodeBlock({
        array: ["-"].concat(heapElements.map(String)),
      })

      solutionHeap.build(heapElements)

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapOperations.name(lang),
        path: permaLink,
        text: t(translationHeapOperations, lang, "taskBuild", [elementsTable, heapType]),
        checkFormat,
        feedback,
      }

      return { question }
    } else {
      const { sequence, heap } = generateOperationSequence(heapType, random)
      solutionHeap = heap

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapOperations.name(lang),
        path: permaLink,
        text: t(translationHeapOperations, lang, "taskCombine", [sequence, heapType]),
        checkFormat,
        feedback,
      }
      return { question }
    }
  },
}
