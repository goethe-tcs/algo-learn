import { generateForLoopQuestion } from "@shared/question-generators/time/utilsStars/uitlsFor.ts"
import { createForForLoop } from "@shared/question-generators/time/utilsStars/utilsForFor.ts"
import { createWhileLoop } from "@shared/question-generators/time/utilsStars/utilsWhile.ts"
import { PseudoCode } from "@shared/utils/pseudoCodeUtils.ts"
import Random from "@shared/utils/random.ts"

/**
 * Sample the source code of a loop that prints stars
 *
 * @param random
 * @returns - Object containing the source code, the name of the function, the
 *   name of the variable, the number of stars printed in the base case and in
 *   the recursive case, as well as the number of recursive calls and the number
 *   to divide by.
 */
export function sampleLoopStars(random: Random): {
  functionText: PseudoCode
  functionName: string
  n: string
  numStars: number
} {
  const functionName = random.choice("fghPp".split(""))
  const variable = random.choice("nmNMxyztk".split(""))
  const availableVarNames = "nmNMxyztk".split("").filter((c) => c !== variable)
  const { code, numStars } = sampleExact({
    random,
    availableVarNames,
  })
  return {
    functionText: code,
    functionName,
    n: variable,
    numStars,
  }
}

/**
 * This function generates two different variable names
 * @param random
 * @param availableVarNames
 */
function generateVariableNames(random: Random, availableVarNames: string[]) {
  const firstVariableName = random.choice(availableVarNames)
  const secondVariableName = random.choice(availableVarNames.filter((v) => v !== firstVariableName))
  return { firstVariableName, secondVariableName }
}

/**
 * This function generates the number of stars to print in different parts of the code
 * @param random
 */
export function generateDifferentAmountOfStarPrints(random: Random) {
  const numPrint = random.int(1, 4)
  const numPrintElse = random.choice([1, 2, 3, 4].filter((n) => n !== numPrint))
  const numPrintBetweenLoops = random.choice([1, 2, 3, 4])
  const numPrintSecondCondition = random.choice([1, 2, 3, 4])
  const numPrintSecondElse = random.choice([1, 2, 3, 4].filter((n) => n !== numPrintSecondCondition))
  const numPrintAfterAll = random.choice([1, 2, 3, 4])
  return {
    numPrint,
    numPrintElse,
    numPrintBetweenLoops,
    numPrintSecondCondition,
    numPrintSecondElse,
    numPrintAfterAll,
  }
}

/**
 * Sample the source code of a simple loop that prints stars
 *
 * @param props
 * @param props.random - Random number generator
 * @param props.availableVarNames - Variable names that can be used
 * @returns Source code
 */
export function sampleExact({
  random,
  availableVarNames = "nmNMxyztk".split(""),
}: {
  random: Random
  availableVarNames?: string[]
}): { code: PseudoCode; numStars: number } {
  const { firstVariableName, secondVariableName } = generateVariableNames(random, availableVarNames)

  const loopType: "for" | "forfor" | "while" = random.choice(["for", "forfor", "while"])

  if (loopType === "for") {
    const forResult = generateForLoopQuestion(firstVariableName, random)
    return {
      numStars: forResult.numStars,
      code: forResult.code,
    }
  } else if (loopType === "forfor") {
    const forForResult = createForForLoop(firstVariableName, secondVariableName, random)
    return {
      numStars: forForResult.numStars,
      code: forForResult.code,
    }
  } else {
    const whileLoopResult = createWhileLoop(firstVariableName, secondVariableName, random)
    return {
      numStars: whileLoopResult.numStars,
      code: whileLoopResult.code,
    }
  }
}
