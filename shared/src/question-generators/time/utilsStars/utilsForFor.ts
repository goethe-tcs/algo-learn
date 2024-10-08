import { BoundsOptions, IfOptions } from "@shared/question-generators/time/utils.ts"
import { calculateNumberOfStars } from "@shared/question-generators/time/utilsStars/calculateNumberOfStars.ts"
import { generateDifferentAmountOfStarPrints } from "@shared/question-generators/time/utilsStars/utils.ts"
import { createPseudoCodeForForLoop } from "@shared/question-generators/time/utilsStars/utilsForForCode.ts"
import Random from "@shared/utils/random.ts"

/**
 * This computes the end value of the first loop based on the manipulation
 * @param endManipulationFirstLoop
 * @param endValueFirstLoop
 */
function computeEndValueFirstLoop(
  endManipulationFirstLoop: BoundsOptions,
  endValueFirstLoop: number,
): number {
  if (endManipulationFirstLoop === "none") {
    return endValueFirstLoop
  } else if (endManipulationFirstLoop.type === "mult") {
    return endValueFirstLoop * endManipulationFirstLoop.value
  } else if (endManipulationFirstLoop.type === "square") {
    return endValueFirstLoop * endValueFirstLoop
  } else {
    return Math.ceil(Math.log2(endValueFirstLoop))
  }
}

/**
 * This computes the start value of the second loop based on the manipulation
 * @param startManipulationSecondLoop
 * @param loopIteration
 * @param startSecondManipulationMultiplier
 * @param startValueSecondLoop
 */
function computeStartValueSecondLoop(
  startManipulationSecondLoop: "none" | "var-normal" | "var-mult" | "var-square",
  loopIteration: number,
  startSecondManipulationMultiplier: number,
  startValueSecondLoop: number,
): number {
  if (startManipulationSecondLoop === "none") {
    return startValueSecondLoop
  } else if (startManipulationSecondLoop === "var-normal") {
    return loopIteration
  } else if (startManipulationSecondLoop === "var-mult") {
    return loopIteration * startSecondManipulationMultiplier
  } else {
    return loopIteration * loopIteration
  }
}

/**
 * This computes the end value of the second loop based on the manipulation
 * @param endManipulationSecondLoop
 * @param endValueSecondLoop
 */
function computeEndValueSecondLoop(
  endManipulationSecondLoop: BoundsOptions,
  endValueSecondLoop: number,
) {
  if (endManipulationSecondLoop === "none") {
    return endValueSecondLoop
  } else if (endManipulationSecondLoop.type === "square") {
    return endValueSecondLoop * endValueSecondLoop
  } else if (endManipulationSecondLoop.type === "mult") {
    return endValueSecondLoop * endManipulationSecondLoop.value
  } else {
    return Math.ceil(Math.log2(endValueSecondLoop))
  }
}

/**
 * This function generates code for a double for loop
 *
 * Example:
 * for y from 0 to 9:
 *   if y is square
 *     print("**")
 *   for x from y*2 to 20*2:
 *     print("*")
 *
 * @param firstVariableName the name of the first variable
 * @param secondVariableName
 * @param random
 */
export function createForForLoop(firstVariableName: string, secondVariableName: string, random: Random) {
  // get all possible random variables via helper function
  const {
    startValueFirstLoop,
    stepValueFirstLoop,
    endValueFirstLoop,
    endManipulationFirstLoop,
    printStarsBetweenLoops,
    conditionFirstLoop,
    elseFirstLoop,
    startValueSecondLoop,
    startManipulationSecondLoop,
    startSecondManipulationMultiplier,
    stepValueSecondLoop,
    endValueSecondLoop,
    endManipulationSecondLoop,
    conditionSecondLoop,
    askFirstVariableInSecondLoop,
    elseSecondLoop,
    printStarsAfterBothLoops,
  } = generateForForRandomVariables(random)

  const {
    numPrint,
    numPrintElse,
    numPrintBetweenLoops,
    numPrintSecondCondition,
    numPrintSecondElse,
    numPrintAfterAll,
  } = generateDifferentAmountOfStarPrints(random)

  const pseudoCodeForForLoop = createPseudoCodeForForLoop(
    stepValueFirstLoop,
    firstVariableName,
    startValueFirstLoop,
    endValueFirstLoop,
    endManipulationFirstLoop,
    printStarsBetweenLoops,
    numPrintBetweenLoops,
    conditionFirstLoop,
    elseFirstLoop,
    numPrintSecondCondition,
    numPrintSecondElse,
    startValueSecondLoop,
    startManipulationSecondLoop,
    startSecondManipulationMultiplier,
    stepValueSecondLoop,
    secondVariableName,
    endValueSecondLoop,
    endManipulationSecondLoop,
    askFirstVariableInSecondLoop,
    conditionSecondLoop,
    elseSecondLoop,
    numPrint,
    numPrintElse,
    printStarsAfterBothLoops,
    numPrintAfterAll,
  )

  const finalEndValueFirstLoop = computeEndValueFirstLoop(endManipulationFirstLoop, endValueFirstLoop)
  let numStars = 0
  for (let i = startValueFirstLoop; i <= finalEndValueFirstLoop; i += stepValueFirstLoop) {
    if (printStarsBetweenLoops) numStars += numPrintBetweenLoops

    numStars += calculateNumberOfStars(
      conditionFirstLoop,
      i,
      numPrintSecondCondition,
      numPrintSecondElse,
      elseFirstLoop,
    )

    let j = computeStartValueSecondLoop(
      startManipulationSecondLoop,
      i,
      startSecondManipulationMultiplier,
      startValueSecondLoop,
    )
    const finalEndValueSecondLoop = computeEndValueSecondLoop(
      endManipulationSecondLoop,
      endValueSecondLoop,
    )

    for (; j <= finalEndValueSecondLoop; j += stepValueSecondLoop) {
      numStars += calculateNumberOfStars(
        conditionSecondLoop,
        askFirstVariableInSecondLoop ? i : j,
        numPrint,
        numPrintElse,
        elseSecondLoop,
        askFirstVariableInSecondLoop ? j : i,
      )
    }
  }

  if (printStarsAfterBothLoops) numStars += numPrintAfterAll

  return { code: pseudoCodeForForLoop, numStars }
}

/**
 * A function to generate the random variables for the forfor loop option
 * @param random
 */
function generateForForRandomVariables(random: Random) {
  // general options to choose from
  const endManipulationOptions: BoundsOptions[] = [
    "none",
    { type: "mult", value: random.int(2, 3) },
    { type: "square", abs: false },
  ]
  const ifOptions: IfOptions[] = ["even", "odd", "none"]

  const startValueFirstLoop = random.int(0, 3)
  const stepValueFirstLoop = random.weightedChoice([
    [1, 0.5],
    [2, 0.35],
    [3, 0.15],
  ])
  const endValueFirstLoop = random.int(6, 10)

  const endManipulationFirstLoop: BoundsOptions = random.weightedChoice([
    [endManipulationOptions[0], 0.7],
    [endManipulationOptions[1], 0.125],
    [endManipulationOptions[2], 0.125],
  ])

  const conditionFirstLoop: IfOptions = random.choice(ifOptions)
  const elseFirstLoop = conditionFirstLoop === "none" ? false : random.bool(0.2)
  // if condMiddle is none (numPrintMiddleIf will be printed instead of numPrintMiddle)
  let printStarsBetweenLoops = random.bool(0.15)
  if (conditionFirstLoop === "none") printStarsBetweenLoops = false

  const startValueSecondLoop = random.int(0, 3)
  const startManipulationSecondLoop: "none" | "var-normal" | "var-mult" | "var-square" =
    endManipulationFirstLoop === "none"
      ? random.weightedChoice([
          ["none", 0.5],
          ["var-normal", 0.3],
          ["var-mult", 0.1],
          ["var-square", 0.1],
        ])
      : "none"
  const startSecondManipulationMultiplier = random.int(2, 3) // only important for var-mult
  // if startSecondManipulation is not none, we cannot display a set nicely (it'd be {x,x+2,x+4,...,19} or so
  const stepValueSecondLoop =
    stepValueFirstLoop !== 1 || startManipulationSecondLoop !== "none"
      ? 1
      : random.weightedChoice([
          [1, 0.2],
          [2, 0.4],
          [3, 0.4],
        ])

  // If we have a manipulation to the start value of the second for based on the first for loop,
  // we may need to increase the endValue of the second for loop for better results.
  // Otherwise, it could be for M from 2*x to 14 (with x \in [2...10])
  // Determine the additional value based on the type of manipulation
  let additionalValue
  if (startManipulationSecondLoop === "var-normal" || startManipulationSecondLoop === "none") {
    additionalValue = endValueFirstLoop
  } else if (startManipulationSecondLoop === "var-mult") {
    additionalValue = endValueFirstLoop * startSecondManipulationMultiplier
  } else {
    additionalValue = endValueFirstLoop * endValueFirstLoop
  }
  // Determine the end value for the second loop
  const endValueSecondLoop =
    startManipulationSecondLoop === "none" ? random.int(6, 10) : additionalValue + random.int(0, 2)

  const endManipulationSecondLoop: BoundsOptions =
    endManipulationFirstLoop !== "none"
      ? "none"
      : random.weightedChoice([
          [endManipulationOptions[0], 0.7],
          [endManipulationOptions[1], 0.125],
          [endManipulationOptions[2], 0.125],
        ])

  // definitely print stars at the end
  const conditionSecondLoop: IfOptions = random.choice(["even", "odd", "same", "square", "none"])
  // using the variable from the first loop for a condition in the second loop
  const askFirstVariableInSecondLoop = random.weightedChoice([
    [true, 0.15],
    [false, 0.85],
  ])
  const elseSecondLoop =
    conditionSecondLoop === "none" || elseFirstLoop // no two else statements (would be too much)
      ? false
      : random.bool()

  const printStarsAfterBothLoops = random.bool(0.05)

  return {
    startValueFirstLoop,
    stepValueFirstLoop,
    endValueFirstLoop,
    endManipulationFirstLoop,
    printStarsBetweenLoops,
    conditionFirstLoop,
    elseFirstLoop,
    startValueSecondLoop,
    startManipulationSecondLoop,
    startSecondManipulationMultiplier,
    stepValueSecondLoop,
    endValueSecondLoop,
    endManipulationSecondLoop,
    conditionSecondLoop,
    askFirstVariableInSecondLoop,
    elseSecondLoop,
    printStarsAfterBothLoops,
  }
}
