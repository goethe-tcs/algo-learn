import type { Language } from "@shared/api/Language.ts"
import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextQuestion,
} from "@shared/api/QuestionGenerator.ts"
import type { UnionFind } from "@shared/question-generators/unionFind/unionFind.ts"
import {
  unionOneBlockCombineNone,
  unionOneBlockCombineOne,
  unionTwoBlocksCombineNone,
  unionTwoBlocksCombineOne,
  unionTwoBlocksCombineSame,
} from "@shared/question-generators/unionFind/utils.ts"
import { WeightedQuickUnionPath } from "@shared/question-generators/unionFind/weightedQuickUnionPath/algorithm.ts"
import { createChainedUnionState } from "@shared/question-generators/unionFind/weightedQuickUnionPath/utilsPath.ts"
import {
  createArrayDisplayCodeBlock,
  createArrayDisplayCodeBlockUserInput,
} from "@shared/utils/arrayDisplayCodeBlock.ts"
import type Random from "@shared/utils/random.ts"
import { t, type Translations } from "@shared/utils/translations.ts"

/**
 * Returns a simple feedback function to check if the user input is the same as
 * the solution union
 * @param solutionUnions - correct calculated union
 * @param lang
 */
export function getFeedbackFunction(
  solutionUnions: UnionFind,
  lang: Language,
): MultiFreeTextFeedbackFunction {
  // fieldIds form input-x x \in [0,1,2,3...]
  return ({ text }) => {
    for (let j = 0; j < solutionUnions.getUnionAmount(); j++) {
      let correctUnion = true
      for (let i = 0; i < solutionUnions.getArray()[j].length; i++) {
        const userFieldAnswer = parseInt(text["input-" + i].trim())
        if (userFieldAnswer !== solutionUnions.getArray()[j][i]) {
          correctUnion = false
        }
      }
      if (correctUnion) {
        return {
          correct: true,
        }
      }
    }
    return {
      correct: false,
      correctAnswer: createArrayDisplayCodeBlock({
        array: solutionUnions.getArray()[0],
        lang,
      }),
    }
  }
}

export function unionFindStartQuestion({
  random,
  union,
  unionSize,
  lang,
  permalink,
  translations,
  name,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  lang: "de" | "en"
  permalink: string
  translations: Translations
  name: string
}) {
  const unionCaseGeneration = random.weightedChoice([
    [unionTwoBlocksCombineOne, 0.35],
    [unionTwoBlocksCombineNone, 0.2],
    [unionTwoBlocksCombineSame, 0.05],
    [unionOneBlockCombineOne, 0.25],
    [unionOneBlockCombineNone, 0.15],
  ])

  let gapField: string
  let gapOperationValues: number[]
  // For path compression, create artificial union states
  if (union instanceof WeightedQuickUnionPath && random.bool(0.8)) {
    const { gapField: _gapField, gapOperationValues: _gapOperationValues } = createChainedUnionState({
      random,
      union,
      lang,
    })
    gapField = _gapField
    gapOperationValues = _gapOperationValues
  } else {
    const { gapField: _gapField, gapOperationValues: _gapOperationValues } = unionCaseGeneration({
      random,
      union,
      unionSize,
      lang,
    })
    gapField = _gapField
    gapOperationValues = _gapOperationValues
  }

  const { arrayDisplayBlock } = createArrayDisplayCodeBlockUserInput({
    numberOfInputFields: union.getArray()[0].length,
    lang,
  })

  const question: MultiFreeTextQuestion = {
    type: "MultiFreeTextQuestion",
    name,
    path: permalink,
    fillOutAll: true,
    text: t(translations, lang, "task", [
      gapField,
      gapOperationValues[0].toString(),
      gapOperationValues[1].toString(),
      arrayDisplayBlock,
    ]),
    feedback: getFeedbackFunction(union, lang),
  }
  return question
}
