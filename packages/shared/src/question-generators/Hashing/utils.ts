import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextFormatFunction,
} from "@shared/api/QuestionGenerator.ts"
import { generateHashFunction } from "@shared/question-generators/Hashing/Functions"
import { MapLinked } from "@shared/question-generators/Hashing/MapLinked"
import {
  MapLinProbing,
  type DoubleHashFunction,
  type HashFunction,
} from "@shared/question-generators/Hashing/MapLinProbing"
import {
  createArrayDisplayCodeBlock,
  createArrayDisplayCodeBlockUserInput,
} from "@shared/utils/arrayDisplayCodeBlock.ts"
import type Random from "@shared/utils/random.ts"
import { t, type Translations } from "@shared/utils/translations.ts"

/**
 * This function creates the view to create a better readable solution for the user
 * @param hashMap
 * @param translations
 * @param lang
 */
function createSolutionViewLinkedHashing(
  hashMap: MapLinked,
  translations: Translations,
  lang: "en" | "de",
) {
  const keyList = hashMap.keysList()
  let tableString = `\n|Index|${t(translations, lang, "Values")}|\n|===|===|\n`
  for (let i = 0; i < keyList.length; i++) {
    if (keyList[i].length === 0) {
      tableString += `|${i}| |\n`
    } else {
      let valueString = "$"
      for (let j = 0; j < keyList[i].length; j++) {
        valueString += keyList[i][j] + "\\rightarrow" // -> not =>
      }
      valueString = valueString.slice(0, -11) + "$"
      tableString += `|${i}|${valueString}|\n`
    }
  }
  return tableString
}

/**
 * Generates a HashMap with a given size and a given number of insertions and deletions
 * @param random
 * @param tableSize - size of the HashMap
 * @param task - "insert" or "insert-delete" (first inserts, then deletes)
 * @param mapStyle - "linked" or "linear"
 * @param hashFunction - one of the hash functions from Functions.ts
 */
export function generateOperationsHashMap({
  random,
  tableSize,
  task,
  mapStyle,
  hashFunction,
}: {
  random: Random
  tableSize: number
  task: "insert" | "insert-delete"
  mapStyle: "linked" | "linear" | "double"
  hashFunction: HashFunction | DoubleHashFunction
}) {
  let hashMap: MapLinked | MapLinProbing
  if (mapStyle === "linear" || mapStyle === "double") {
    hashMap = new MapLinProbing({ size: tableSize, hashFunction: hashFunction })
  } else {
    if (isSimpleHashFunction(hashFunction)) {
      hashMap = new MapLinked(tableSize, hashFunction)
    } else {
      throw new Error("Provided function is not a valid HashFunction")
    }
  }

  const insertions: number[] = []
  const possibleValues = random.shuffle(Array.from({ length: 25 }, (_, i) => i + 1))
  for (let i = 0; i < tableSize - random.int(0, 2); i++) {
    hashMap.insert(possibleValues[i])
    insertions.push(possibleValues[i])
  }
  const deletions: number[] = []
  if (task === "insert-delete") {
    for (let i = 0; i < random.int(1, 3); i++) {
      const key = random.choice(hashMap.keys())
      hashMap.delete(key)
      deletions.push(key)
    }
  }

  return {
    hashMap,
    insertions,
    deletions,
  }
}

/**
 * Checks if the given function is a valid HashFunction (doubleHashing not allowed)
 * @param functionToCheck
 */
function isSimpleHashFunction(
  functionToCheck: HashFunction | DoubleHashFunction,
): functionToCheck is HashFunction {
  return functionToCheck && typeof functionToCheck === "function" && functionToCheck.length === 2
}

/**
 * Generates a question base with a hash map and operations
 * Used by both linear probing and linked hashing
 * @param random
 * @param variant
 * @param translations
 * @param lang
 */
export function generateQuestionBase(
  random: Random,
  variant: "linear" | "linked" | "double",
  translations: Translations,
  lang: "de" | "en",
) {
  const tableSize = random.choice([7, 11]) // has to be prime!
  const task: "insert" | "insert-delete" = random.weightedChoice([
    ["insert", 0.85],
    ["insert-delete", 0.15],
  ])

  const randomHashFunction = generateHashFunction(tableSize, variant, random)()
  const { hashMap, insertions, deletions } = generateOperationsHashMap({
    random,
    tableSize,
    task,
    mapStyle: variant,
    hashFunction: randomHashFunction.hashFunction,
  })
  const insertValuesString = t(translations, lang, "insert", [insertions.toString()])
  const deleteValuesString =
    deletions.length > 0 ? t(translations, lang, "delete", [deletions.toString()]) : ""

  return {
    tableSize,
    randomHashFunction,
    hashMap,
    insertValuesString,
    deleteValuesString,
  }
}

/**
 * This generates a question for hashing with linked lists
 * @param random
 * @param translations
 * @param lang
 */
export function generateQuestionLinkedHashing(
  random: Random,
  translations: Translations,
  lang: "de" | "en",
) {
  const { tableSize, randomHashFunction, hashMap, insertValuesString, deleteValuesString } =
    generateQuestionBase(random, "linked", translations, lang)

  const checkFormat: MultiFreeTextFormatFunction = ({ text }, fieldID) => {
    // check if the input is a list of numbers separated by commas or - or ->
    const userInput = text[fieldID].trim()
    const userInputList = userInput
      .split(/,|\s*->\s*|-(?!>)/)
      .map((el) => el.trim())
      .filter((el) => el !== "")
    let linkedListString = "$"
    for (const input of userInputList) {
      if (!/^\d+$/.test(input)) {
        return { valid: false, message: t(translations, lang, "checkFormat") }
      }
      linkedListString += `${input} \\rightarrow`
    }
    linkedListString = linkedListString.slice(0, -11) + "$" // slice to remove last \\rightarrow
    return { valid: true, message: linkedListString }
  }

  const feedback: MultiFreeTextFeedbackFunction = ({ text }) => {
    if (hashMap instanceof MapLinProbing) {
      throw new Error("This function should only be used for linked hashing")
    }
    const wrongAnswerFeedback = {
      correct: false,
      correctAnswer: createSolutionViewLinkedHashing(hashMap, translations, lang),
    }

    const correctSolution: number[][] = hashMap.keysList()
    for (let i = 0; i < hashMap.getSize(); i++) {
      const userRowInput = text[`row-${i}`].trim()
      if (correctSolution[i].length === 0 && userRowInput !== "") {
        return wrongAnswerFeedback
      } else {
        const userRowInputList = userRowInput
          .split(/,|\s*->\s*|-(?!>)/)
          .map((el) => el.trim())
          .filter((el) => el !== "")
        if (userRowInputList.length !== correctSolution[i].length) {
          return wrongAnswerFeedback
        }
        for (let j = 0; j < correctSolution[i].length; j++) {
          if (userRowInputList[j] !== correctSolution[i][j].toString()) {
            return wrongAnswerFeedback
          }
        }
      }
    }

    return {
      correct: true,
    }
  }

  // create a table with two columns and for as many rows as the hashMap is long
  let inputTableString = `\n|Index|${t(translations, lang, "Values")}|\n|===!|!===|\n`
  for (let i = 0; i < hashMap.getSize(); i++) {
    inputTableString += `|${i}|{{row-${i}#TL###overlay}}|\n`
  }

  return {
    tableSize,
    randomHashFunction,
    insertValuesString,
    deleteValuesString,
    inputTableString,
    checkFormat,
    feedback,
  }
}

/**
 * This function generates a question for hashing with linear probing or double hashing
 * @param random
 * @param variant - here
 * @param translations
 * @param lang
 */
export function generateQuestionLinearDoubleProbing(
  random: Random,
  variant: "linear" | "double",
  translations: Translations,
  lang: "de" | "en",
) {
  const { tableSize, randomHashFunction, hashMap, insertValuesString, deleteValuesString } =
    generateQuestionBase(random, variant, translations, lang)

  const { arrayDisplayBlock } = createArrayDisplayCodeBlockUserInput({
    numberOfInputFields: tableSize,
    lang,
  })

  const feedback: MultiFreeTextFeedbackFunction = ({ text }) => {
    // input-x are the keys in text
    const solutionMap = (hashMap as MapLinProbing).keysList()
    const wrongAnswerFeedback = {
      correct: false,
      correctAnswer: createArrayDisplayCodeBlock({
        array: solutionMap.map((x) => (x === null ? " " : x)),
        lang,
      }),
    }
    for (let i = 0; i < solutionMap.length; i++) {
      if (solutionMap[i] === null) {
        if (text["input-" + i].trim() !== "") {
          return wrongAnswerFeedback
        }
      } else if (solutionMap[i]!.toString() !== text["input-" + i].trim()) {
        return wrongAnswerFeedback
      }
    }
    return {
      correct: true,
    }
  }
  return {
    tableSize,
    randomHashFunction,
    insertValuesString,
    deleteValuesString,
    arrayDisplayBlock,
    feedback,
  }
}
