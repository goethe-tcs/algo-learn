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
      "Consider a **{{0}}-Heap**. Initally the Heap is empty. You insert the following elements in the given order: {{1}} Enter the state of the Heap after the insertions.",
    taskExtract:
      "Consider the following **{{0}}-Heap**: {{1}} You extract the {{2}} element **{{3}}** times. Enter the state of the Heap after the extractions.",
    taskBuild:
      "Consider the following **Array**: {{0}} Enter the state of the Heap after **Build-{{1}}-Heap** on the above array.",
    taskCombine:
      "Let **{{0}}** be a sequence of operations, where a **number** represents **inserting** this number into the **{{2}}-Heap** and $*$ represents an **Extract-{{2}}** operation. \\[{{0}}={{1}}\\] Enter the state of the Heap after all operations. Initially the Heap is empty.",
    checkFormat: "Please only enter Integer seperated by commas.",
  },
  de: {
    name: "Heap-Operationen",
    description: "Bestimme den Zustand eines Heaps nach unterschiedlichen Operationen",
    taskInsert:
      "Betrachte einen **{{0}}-Heap**. Anfänglich ist der Heap leer. Du fügst die folgenden Elemente in gegebener Reihenfolge ein: {{1}} Gib den Heap nach den Einfügeoperationen an.",
    taskExtract:
      "Betrachte den folgenden **{{0}}-Heap**: {{1}} Du extrahierst das {{2}} Element **{{3}}** mal. Gib den Heap nach den Extraktionen an.",
    taskBuild:
      "Betrachte das folgende Array: {{0}} Gib den Heap nach **Build-{{1}}-Heap** auf dem obigen Array an.",
    taskCombine:
      "Sei **{{0}}** eine Sequenz von Operationen, wobei eine **Zahl** das **Einfügen** dieser Zahl in den **{{2}}-Heap** repräsentiert und $*$ eine **Extract-{{2}}** Operation. \\[{{0}}={{1}}\\] Gib den Heap nach allen Operationen an. Der Heap ist anfangs leer.",
    checkFormat: "Bitte nur ganze Zahlen durch Komma getrennt eingeben.",
  },
}

const wordTranslations: Translations = {
  en: {
    maximal: "maximal",
    minimal: "minimal",
  },
  de: {
    maximal: "maximale",
    minimal: "minimale",
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
      allowedValues: ["insert", "extract", "build", "combine"],
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
            array: solutionHeap.getHeap(),
            startingIndex: 1,
          }),
        }
      }

      return {
        correct: true,
      }
    }

    if (variant === "insert") {
      // build a table representing the index - value pair starting at 1
      let elementsTable = createArrayDisplayCodeBlock({
        array: heapElements,
      })
      elementsTable += "|#div_my-5#||\n"

      for (const element of heapElements) {
        solutionHeap.insert(element)
      }

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapOperations.name(lang),
        path: permaLink,
        text: t(translationHeapOperations, lang, "taskInsert", [heapType, elementsTable]),
        checkFormat,
        feedback,
      }
      return { question }
    } else if (variant === "extract") {
      for (const element of heapElements) {
        solutionHeap.insert(element)
      }
      const elementsTable = createArrayDisplayCodeBlock({
        array: solutionHeap.getHeap(),
        startingIndex: 1,
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
          t(wordTranslations, lang, heapType === "Min" ? "minimal" : "maximal"),
          extractAmount.toString(),
        ]),
        checkFormat,
        feedback,
      }
      return { question }
    } else if (variant === "build") {
      const elementsTable = createArrayDisplayCodeBlock({
        array: heapElements,
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
      const variableName = random.choice(["A", "B", "C", "D", "E"])

      const { sequence, heap } = generateOperationSequence(heapType, random)
      solutionHeap = heap

      const question: FreeTextQuestion = {
        type: "FreeTextQuestion",
        name: HeapOperations.name(lang),
        path: permaLink,
        text: t(translationHeapOperations, lang, "taskCombine", [variableName, sequence, heapType]),
        checkFormat,
        feedback,
      }
      return { question }
    }
  },
}
