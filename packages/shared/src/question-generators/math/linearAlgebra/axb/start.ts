import type {
  MultiFreeTextFeedbackFunction,
  MultiFreeTextFormatFunction,
  MultiFreeTextQuestion,
} from "@shared/api/QuestionGenerator.ts"
import { AxbGenerator } from "@shared/question-generators/math/linearAlgebra/axb/axbGen"
import { allRandomMatrix } from "@shared/question-generators/math/linearAlgebra/generations/matrix"
import { matrixToTex, vectorToTex } from "@shared/question-generators/math/linearAlgebra/tex"
import { _ } from "@shared/utils/generics.ts"
import math from "@shared/utils/math.ts"
import { createMatrixInput } from "@shared/utils/matrixInput.ts"
import type Random from "@shared/utils/random.ts"
import { t, type Translations } from "@shared/utils/translations.ts"

/**
 * This function generates a question for the start variant of the Ax=b question
 * @param matrixSize - size of the matrix A, x, and b
 * @param translations
 * @param random
 * @param lang
 * @param permalink
 */
export function generateVariantStartAxb(
  matrixSize: number,
  translations: Translations,
  random: Random,
  lang: "de" | "en",
  permalink: string,
) {
  const checkFormat: MultiFreeTextFormatFunction = ({ text }, fieldID) => {
    // check if is a number
    if (!/^\d+$/.test(text[fieldID])) {
      return { valid: false, message: t(translations, lang, "validationOnlyNumbers") }
    }
    return { valid: true, message: "" }
  }

  const feedback: MultiFreeTextFeedbackFunction = ({ text }) => {
    // rebuild an x vector from the input fields
    const userX: number[] = []
    for (let i = 0; i < matrixSize; i++) {
      userX.push(parseFloat(text[`x_${i}_0`].replace(/\s/g, "")))
    }
    const userB = math.multiply(A, userX)
    const correct = _.isEqual(userB, b)
    if (correct) {
      return {
        correct: true,
      }
    }
    return {
      correct: false,
      correctAnswer: "$x=" + vectorToTex(x, "r") + "$",
    }
  }

  let x: number[]
  do {
    x = Array.from({ length: matrixSize }, () => random.int(-8, 8))
  } while (math.norm(x) === 0)
  // generate a random A matrix
  const A = allRandomMatrix({
    random,
    rows: matrixSize,
    cols: matrixSize,
    min: -8,
    max: 8,
    precision: 1,
  })
  // calculate b
  const b = math.multiply(A, x)

  const matrixInput = createMatrixInput({
    rows: matrixSize,
    cols: 1,
    name: "$x=$",
    elementOf: `$\\in\\mathbb{Z}^${matrixSize}$`,
  })

  const question: MultiFreeTextQuestion = {
    type: "MultiFreeTextQuestion",
    name: AxbGenerator.name(lang),
    path: permalink,
    fillOutAll: true,
    text: t(translations, lang, "text", [matrixToTex(A, "r"), vectorToTex(b), matrixInput.matrixInput]),
    checkFormat,
    feedback,
  }

  return {
    question,
  }
}
