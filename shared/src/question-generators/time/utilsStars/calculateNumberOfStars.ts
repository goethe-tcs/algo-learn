import { IfOptions } from "@shared/question-generators/time/utils.ts"

interface StarCalculationParams {
  loopIteration: number
  starsToPrintBase: number
  starsToPrintElse: number
  elseStatement: boolean
}

/**
 * This function calculates the number of stars to print based on the condition
 * @param condition - the condition to check
 * @param loopIteration - the current loop iteration
 * @param starsToPrintBase - the number of stars to print if the condition is true
 * @param starsToPrintElse - the number of stars to print if the condition is false
 * @param elseStatement - if there is an else statement
 * @param j - the number to compare to if the condition is "same" (default NaN)
 *            this will be the second loop iteration value (but it has not to be)
 */
export function calculateNumberOfStars(
  condition: IfOptions,
  loopIteration: number,
  starsToPrintBase: number,
  starsToPrintElse: number,
  elseStatement: boolean,
  j: number = NaN,
): number {
  const calculationParameters = {
    loopIteration,
    starsToPrintBase,
    starsToPrintElse,
    elseStatement,
  }
  switch (condition) {
    case "odd":
      return calculateCondition(calculationParameters, isOdd)
    case "even":
      return calculateCondition(calculationParameters, isEven)
    case "square":
      return calculateCondition(calculationParameters, isSquare)
    case "same":
      return calculateCondition(calculationParameters, (n) => isSame(n, j))
    case "none":
      return calculationParameters.starsToPrintBase

    default:
      return 0
  }
}

function calculateCondition(
  { loopIteration, starsToPrintBase, starsToPrintElse, elseStatement }: StarCalculationParams,
  conditionFunction: (n: number) => boolean,
): number {
  if (conditionFunction(loopIteration)) {
    return starsToPrintBase
  } else if (elseStatement) {
    return starsToPrintElse
  }
  return 0
}

function isOdd(n: number): boolean {
  return n % 2 !== 0
}

function isEven(n: number): boolean {
  return n % 2 === 0
}

function isSquare(n: number): boolean {
  return Number.isInteger(Math.sqrt(n))
}

function isSame(n: number, j: number): boolean {
  return n === j
}
