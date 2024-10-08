import {
  BoundsOptions,
  createBasicForLine,
  createIfCondition,
  IfOptions,
} from "@shared/question-generators/time/utils.ts"
import { calculateNumberOfStars } from "@shared/question-generators/time/utilsStars/calculateNumberOfStars.ts"
import { generateDifferentAmountOfStarPrints } from "@shared/question-generators/time/utilsStars/utils.ts"
import {
  printStarsNew,
  PseudoCode,
  PseudoCodeBlock,
  PseudoCodeFor,
  PseudoCodeIf,
} from "@shared/utils/pseudoCodeUtils.ts"
import Random from "@shared/utils/random.ts"

/**
 * This function generates random variables for the loop
 * Those variables are the structure of the loop
 * @param random
 */
function generateRandomConditions(random: Random) {
  const startValueLoop = random.int(0, 2)
  const endValueLoop = random.int(6, 10)

  const endManipulation = random.weightedChoice([
    ["none" as BoundsOptions, 0.7],
    [{ type: "mult", value: random.int(2, 3) }, 0.125],
    [{ type: "square", abs: false }, 0.125],
    [{ type: "log", value: 2 }, 0.05],
  ])

  const condition: IfOptions = random.choice(["none", "even", "odd", "square"])
  const elseStatement = condition !== "none" ? random.bool(0.7) : false

  return { startValueLoop, endValueLoop, endManipulation, condition, elseStatement }
}

/**
 * This function creates the pseudo code for the for-loop
 * @param firstVariableName
 * @param startValueLoop
 * @param endValueLoop
 * @param endManipulation
 * @param cond
 * @param numPrint
 * @param elseStatement
 * @param numPrintElse
 */
function createPseudoCodeFor({
  firstVariableName,
  startValueLoop,
  endValueLoop,
  endManipulation,
  condition,
  numPrint,
  elseStatement,
  numPrintElse,
}: {
  firstVariableName: string
  startValueLoop: number
  endValueLoop: number
  endManipulation: BoundsOptions
  condition: IfOptions
  numPrint: number
  elseStatement: boolean
  numPrintElse: number
}) {
  const completeCode: PseudoCode = []
  const bodyBlock: PseudoCodeBlock = {
    block: [],
  }
  completeCode.push(bodyBlock)

  const forStatement: PseudoCodeFor = createBasicForLine({
    variableName: firstVariableName,
    startValueLoop: startValueLoop.toString(),
    endValueLoop: endValueLoop.toString(),
    endManipulation,
  })
  bodyBlock.block.push(forStatement)

  if (condition === "none") {
    forStatement.for.do = {
      block: [printStarsNew(numPrint)],
    }
  } else {
    const ifStatement: PseudoCodeIf = createIfCondition({
      firstVariableName,
      condition,
      elseStatement,
      numPrint,
      numPrintElse,
    })
    forStatement.for.do = {
      block: [ifStatement],
    }
  }
  return completeCode
}

/**
 * This function checks if the loop should continue
 * @param loopIteration - current iteration of the loop
 * @param endManipulation - the manipulation of the end value of the loop
 * @param endValueLoop - the end value of the loop
 */
function forLoopConditionCheck(
  loopIteration: number,
  endManipulation: BoundsOptions,
  endValueLoop: number,
) {
  if (endManipulation === "none") {
    return loopIteration <= endValueLoop
  } else if (endManipulation.type === "mult") {
    return loopIteration <= endValueLoop * endManipulation.value
  } else if (endManipulation.type === "square") {
    return loopIteration <= endValueLoop * endValueLoop
  } else {
    return loopIteration <= Math.ceil(Math.log2(endValueLoop))
  }
}

/**
 * This function generates code for a for loop
 *
 * Example:
 * for t from 1 to 9
 *   if t is odd
 *     print("***")
 *
 * @param firstVariableName
 * @param random
 */
export function generateForLoopQuestion(firstVariableName: string, random: Random) {
  const { numPrint, numPrintElse } = generateDifferentAmountOfStarPrints(random)
  const { startValueLoop, endValueLoop, endManipulation, condition, elseStatement } =
    generateRandomConditions(random)
  const completeCode = createPseudoCodeFor({
    firstVariableName,
    startValueLoop,
    endValueLoop,
    endManipulation,
    condition,
    numPrint,
    elseStatement,
    numPrintElse,
  })

  let numStars = 0
  for (let i = startValueLoop; forLoopConditionCheck(i, endManipulation, endValueLoop); i++) {
    numStars += calculateNumberOfStars(condition, i, numPrint, numPrintElse, elseStatement)
  }

  return { numStars, code: completeCode }
}
