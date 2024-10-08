/**
 * This file includes standard feedback functions which could be used in the question generators.
 */
import { FreeTextFeedbackFunction } from "@shared/api/QuestionGenerator.ts"
import { createArrayDisplayCodeBlock } from "@shared/utils/arrayDisplayCodeBlock.ts"
import { parseStringToArray } from "@shared/utils/checkFormatStandard.ts"

export function feedbackArray({
  solution,
  solutionTable = true,
}: {
  solution: string[]
  solutionTable?: boolean
}) {
  const normal: FreeTextFeedbackFunction = ({ text }) => {
    // remove all whitespaces
    text = text.replace(/\s/g, "")

    // parse user input into an array to compare it with the solution
    const inputArray: string[] = parseStringToArray(text, ", ")

    // check if both lengths are the same
    if (inputArray.length !== solution.length) {
      return {
        correct: false,
        correctAnswer: solutionTable
          ? createArrayDisplayCodeBlock({
              array: solution,
            })
          : "",
      }
    }

    // compare each value
    for (let i = 0; i < solution.length; i++) {
      if (inputArray[i].trim() !== solution[i].trim()) {
        return {
          correct: false,
          correctAnswer: solutionTable
            ? createArrayDisplayCodeBlock({
                array: solution,
              })
            : "",
        }
      }
    }

    // no error found implies correct answer
    return {
      correct: true,
    }
  }

  return {
    normal,
  }
}
