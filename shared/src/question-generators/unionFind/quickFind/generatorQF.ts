import { FreeTextQuestion, QuestionGenerator } from "@shared/api/QuestionGenerator"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter"
import { QuickFind } from "@shared/question-generators/unionFind/quickFind/quickFindAlgorithm"
import {
  unionOneBlockCombineNone,
  unionOneBlockCombineOne,
  unionTwoBlocksCombineBoth,
  unionTwoBlocksCombineNone,
  unionTwoBlocksCombineOne,
  unionTwoBlocksCombineSame,
} from "@shared/question-generators/unionFind/quickFind/utilsQF"
import { checkFormatArray } from "@shared/utils/checkFormatStandard"
import { feedbackArray } from "@shared/utils/feedbackStandard"
import Random from "@shared/utils/random"
import { t, tFunctional, Translations } from "@shared/utils/translations"

const translations: Translations = {
  en: {
    name: "QuickFind",
    description: "Determine QuickFind state after Union operation",
    task: "A state of the Quick-Find data structure is given as the following array: \n{{0}}\n We call Union({{1}}, {{2}}). Provide the resulting state.",
    explanationUnion:
      "We assume that the operation **Union(**$i$**,** $j$**)** always sets the value specified by **Find(**$i$**)** to the value specified by **Find(**$j$**)**.",
  },
  de: {
    name: "QuickFind",
    description: "Bestimme QuickFind-Zustand nach Union-Operation",
    task: "Ein Zustand der Quick-Find Datenstruktur ist als folgendes Array gegeben: \n{{0}}\n Wir rufen **Union({{1}}, {{2}})** auf. Gib den Zustand an, der dadurch entsteht.",
    explanationUnion:
      "Wir nehmen an, dass die Operation **Union(**$i$**,** $j$**)** immer den durch **Find(**$i$**)** spezifizierten Wert auf den von **Find(**$j$**)** spezifierten Wert setzt.",
  },
}

const wordTranslations: Translations = {
  en: {
    Value: "Value",
  },
  de: {
    Value: "Wert",
  },
}

export const QuickFindGenerator: QuestionGenerator = {
  id: "ufqf",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["union-find", "quick-find"],
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["start"],
    },
  ],

  generate(lang, parameters, seed) {
    const random = new Random(seed)

    // for quickFind size of 6 or 7 is enough
    const unionSize = random.int(6, 7)

    const union = new QuickFind(unionSize)

    const unionCaseGeneration = random.weightedChoice([
      [unionTwoBlocksCombineBoth, 0.25],
      [unionTwoBlocksCombineOne, 0.25],
      [unionTwoBlocksCombineNone, 0.1],
      [unionTwoBlocksCombineSame, 0.05],
      [unionOneBlockCombineOne, 0.25],
      [unionOneBlockCombineNone, 0.1],
    ])

    const { gapField: gapField_, gapOperationValues } = unionCaseGeneration({
      random,
      union,
      unionSize,
    })

    // replace Value with the translation of Value (German Wert)
    const gapField = gapField_.replace("Value", t(wordTranslations, lang, "Value"))

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: QuickFindGenerator.name(lang),
      path: serializeGeneratorCall({
        generator: QuickFindGenerator,
        lang,
        parameters,
        seed,
      }),
      text: t(translations, lang, "task", [
        gapField,
        gapOperationValues[0].toString(),
        gapOperationValues[1].toString(),
      ]),
      bottomText: t(translations, lang, "explanationUnion"),
      checkFormat: checkFormatArray({ lang, values: "int" }).display,
      feedback: feedbackArray({ solution: union.getArray().map((x) => x.toString()) }).normal,
    }

    return {
      question,
      testing: {
        union,
        gapField,
        gapOperationValues,
      },
    }
  },
}
