import type { QuestionGenerator } from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import {
  generateQuestionLinearDoubleProbing,
  generateQuestionLinkedHashing,
} from "@shared/question-generators/Hashing/utils.ts"
import Random from "@shared/utils/random.ts"
import { t, tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Hashing",
    description: "Correctly insert values into a hash map",
    linearProbing: "Linear Probing",
    linkedList: "Linked List",
    doubleHashing: "Double Hashing",
    insert: "We **insert** the following keys in the given order: \\[{{0}}\\]",
    delete: "and then **delete** the following keys in the given order: \\[{{0}}\\]",
    text: `Consider a hash table of size \${{0}}$ implemented with **"{{1}}"**. 
{{2}}
{{3}}
    The hash-function {{4}} is: 
{{5}} 
    Enter the final state of the hash table.
{{6}}`,
    checkFormat: "Please enter a list of number separated by '-' or '->'",
  },
  de: {
    name: "Hashing",
    description: "Füge Werte korrekt in eine Hash-Map ein",
    linearProbing: "Linearem Sondieren",
    linkedList: "Verketteter Liste",
    doubleHashing: "Doppeltem Hashing",
    insert: "Wir **fügen** die folgenden Schlüssel in gegebener Reihenfolge ein: \\[{{0}}\\]",
    delete: "und dann **löschen** wir die folgenden Schlüssel in gegebener Reihenfolge: \\[{{0}}\\]",
    text: `Betrachten Sie eine Hashtabelle der Größe \${{0}}$, die mit **"{{1}}"** implementiert ist.
{{2}}
{{3}}
    Die Hash-Funktion {{4}} ist: 
{{5}}
    Gib den finalen Zustand der Hashtabelle ein.
{{6}}`,
    checkFormat: "Bitte gib eine Liste von Zahlen ein, die durch '-' oder '->' getrennt sind",
  },
}

export const hashingGenerator: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  id: "hashing",
  description: tFunctional(translations, "description"),
  tags: ["hashing", "hash-map", "hash-list", "hash-function"],
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["linear", "linked", "double"],
    },
  ],

  generate(lang, parameters, seed) {
    const random = new Random(seed)

    const permalink = serializeGeneratorCall({
      generator: hashingGenerator,
      lang,
      parameters,
      seed,
    })

    const variant = parameters.variant as "linked" | "linear" | "double"
    if (variant === "linked") {
      const {
        tableSize,
        randomHashFunction,
        insertValuesString,
        deleteValuesString,
        inputTableString,
        checkFormat,
        feedback,
      } = generateQuestionLinkedHashing(random, translations, lang)
      return {
        question: {
          type: "MultiFreeTextQuestion",
          name: t(translations, lang, "name"),
          path: permalink,
          text: t(translations, lang, "text", [
            tableSize.toString(),
            t(translations, lang, "linkedList"),
            insertValuesString,
            deleteValuesString,
            "$h(x)$",
            randomHashFunction.hashFunctionString,
            inputTableString,
          ]),
          fillOutAll: false,
          checkFormat,
          feedback,
        },
      }
    } else if (variant === "linear") {
      const {
        tableSize,
        randomHashFunction,
        insertValuesString,
        deleteValuesString,
        arrayDisplayBlock,
        feedback,
      } = generateQuestionLinearDoubleProbing(random, "linear", translations, lang)
      return {
        question: {
          type: "MultiFreeTextQuestion",
          name: t(translations, lang, "name"),
          path: permalink,
          fillOutAll: false,
          text: t(translations, lang, "text", [
            tableSize.toString(),
            t(translations, lang, "linearProbing"),
            insertValuesString,
            deleteValuesString,
            "$h(x)$",
            randomHashFunction.hashFunctionString,
            arrayDisplayBlock,
          ]),
          feedback,
        },
      }
    } else {
      const {
        tableSize,
        randomHashFunction,
        insertValuesString,
        deleteValuesString,
        arrayDisplayBlock,
        feedback,
      } = generateQuestionLinearDoubleProbing(random, "double", translations, lang)
      return {
        question: {
          type: "MultiFreeTextQuestion",
          name: t(translations, lang, "name"),
          path: permalink,
          fillOutAll: false,
          text: t(translations, lang, "text", [
            tableSize.toString(),
            t(translations, lang, "doubleHashing"),
            insertValuesString,
            deleteValuesString,
            "$h_i(x)$",
            randomHashFunction.hashFunctionString,
            arrayDisplayBlock,
          ]),
          feedback,
        },
      }
    }
  },
}
