import {
  BoundsOptions,
  createIfCondition,
  createWhileChangeValues,
  createWhileLine,
  IfOptions,
} from "@shared/question-generators/time/utils.ts"
import { calculateNumberOfStars } from "@shared/question-generators/time/utilsStars/calculateNumberOfStars.ts"
import { generateDifferentAmountOfStarPrints } from "@shared/question-generators/time/utilsStars/utils.ts"
import { conditionCheck } from "@shared/question-generators/time/utilsStars/utilsWhileCondition.ts"
import { computeStartEndVarsWhile } from "@shared/question-generators/time/utilsStars/utilsWhileVarValues.ts"
import {
  printStarsNew,
  PseudoCode,
  PseudoCodeBlock,
  PseudoCodeWhile,
} from "@shared/utils/pseudoCodeUtils.ts"
import Random from "@shared/utils/random.ts"

/**
 *
 * You have many different cases how the loop is constructed
 *
 * The options are listed below
 *
 * Example result:
 * let t = 8, let n = 8
 * while t == n:
 *   if t is odd
 *     print("*")
 *   t = floor(t / 2)
 *   n += 3
 *
 * @param firstVariableName the name of the first variable
 * @param secondVariableName second variable
 * @param random
 */
export function createWhileLoop(firstVariableName: string, secondVariableName: string, random: Random) {
  const { numPrint, numPrintElse, numPrintAfterAll } = generateDifferentAmountOfStarPrints(random)

  const {
    firstVariableValue,
    secondVariableValue,
    endValue,
    variableOrder,
    compareOption,
    endManipulation,
    whileCaseOption,
  } = computeStartEndVarsWhile(random)

  // Choose a condition
  const condEnd: IfOptions = random.choice(["even", "odd", "square", "none"])
  const elseAfter = condEnd === "none" ? false : random.bool(0.3)
  const printAfter = random.bool(0.25)

  const pseudoCode: PseudoCode = []
  const pseudoCodeBlock: PseudoCodeBlock = {
    block: [],
  }
  pseudoCode.push(pseudoCodeBlock)

  let compareVar = ""
  if (
    (whileCaseOption.toLowerCase().indexOf("x") !== -1 &&
      whileCaseOption.toLowerCase().indexOf("y") !== -1) ||
    variableOrder === "xy" ||
    variableOrder === "yx"
  ) {
    compareVar = random.choice(["var1", "var2"])
    pseudoCodeBlock.block.push({
      state: {
        assignment: firstVariableName,
        value: [firstVariableValue.toString()],
      },
    })
    pseudoCodeBlock.block.push({
      state: {
        assignment: secondVariableName,
        value: [secondVariableValue.toString()],
      },
    })
  } else if (whileCaseOption.toLowerCase().indexOf("x") !== -1) {
    pseudoCodeBlock.block.push({
      state: {
        assignment: firstVariableName,
        value: [firstVariableValue.toString()],
      },
    })
    compareVar = "var1"
  } else if (whileCaseOption.toLowerCase().indexOf("y") !== -1) {
    pseudoCodeBlock.block.push({
      state: {
        assignment: firstVariableName,
        value: [secondVariableValue.toString()],
      },
    })
    compareVar = "var2"
  }

  // while loop statement
  // const vars = random.choice(["xy", "yx", "xn"])
  // only manipulate the greater value
  let whilePseudoCode: PseudoCodeWhile
  if (variableOrder === "xy") {
    whilePseudoCode = createWhileLine({
      start: { variable: firstVariableName },
      startManipulation: secondVariableValue > firstVariableValue ? "none" : endManipulation,
      end: { variable: secondVariableName },
      endManipulation: secondVariableValue > firstVariableValue ? endManipulation : "none",
      compare: compareOption,
    })
  } else if (variableOrder === "yx") {
    whilePseudoCode = createWhileLine({
      start: { variable: secondVariableName },
      startManipulation: firstVariableValue > secondVariableValue ? "none" : endManipulation,
      end: { variable: firstVariableName },
      endManipulation: firstVariableValue > secondVariableValue ? endManipulation : "none",
      compare: compareOption,
    })
  } else {
    whilePseudoCode = createWhileLine({
      start: { variable: firstVariableName },
      startManipulation: firstVariableValue < endValue ? "none" : endManipulation,
      end: endValue.toString(),
      endManipulation: firstVariableValue < endValue ? endManipulation : "none",
      compare: compareOption,
    })
  }

  pseudoCodeBlock.block.push(whilePseudoCode)
  const whilePseudoBlock: PseudoCodeBlock = {
    block: [],
  }
  whilePseudoCode.while.do = whilePseudoBlock

  if (condEnd === "none") {
    whilePseudoBlock.block.push(printStarsNew(numPrint))
  } else {
    whilePseudoBlock.block.push(
      createIfCondition({
        firstVariableName: compareVar === "var1" ? firstVariableName : secondVariableName,
        condition: condEnd,
        elseStatement: elseAfter,
        numPrint,
        numPrintElse,
      }),
    )
  }

  let firstChangeValue = random.int(1, 3)
  let secondChangeValue = random.int(1, 3)

  const changedCode = createWhileChangeValues({
    cOption: whileCaseOption,
    firstChangeValue,
    secondChangeValue,
    firstVariableName: firstVariableName,
    secondVariableName: secondVariableName,
    compare: compareOption,
    vars: variableOrder,
    random,
  })
  changedCode.assignments.forEach((assignment) => whilePseudoBlock.block.push({ state: assignment }))
  firstChangeValue = changedCode.firstChangeValue
  secondChangeValue = changedCode.secondChangeValue

  const varToManipulate = computeVariableToManipulateWhile(
    firstVariableValue,
    secondVariableValue,
    endValue,
    endManipulation,
    variableOrder,
  )

  // create the while loop
  let i = firstVariableValue
  let j = secondVariableValue
  let numStars = 0

  while (
    conditionCheck(i, j, varToManipulate, variableOrder, compareOption, endValue, endManipulation)
  ) {
    // calculate the stars
    numStars += calculateNumberOfStars(
      condEnd,
      compareVar === "var1" ? i : j,
      numPrint,
      numPrintElse,
      elseAfter,
    )

    const changedCode = createWhileChangeValues({
      cOption: whileCaseOption,
      firstChangeValue,
      secondChangeValue,
      compare: compareOption,
      vars: variableOrder,
      changeCode: false,
      changeFirstVariable: i,
      changeSecondVariable: j,
      random,
    })
    i = changedCode.changeFirstVariable
    j = changedCode.changeSecondVariable
  }

  if (printAfter) {
    pseudoCodeBlock.block.push(printStarsNew(numPrintAfterAll))
    numStars += numPrintAfterAll
  }

  return { code: pseudoCode, numStars }
}

function computeVariableToManipulateWhile(
  startVar1: number,
  startVar2: number,
  endValue: number,
  endManipulation: BoundsOptions,
  vars: "xy" | "yx" | "xn",
): "i" | "j" | "e" | "" {
  let varToManipulate: "i" | "j" | "e" | "" = ""
  if (endManipulation !== "none") {
    if (vars === "xn") {
      if (endManipulation.type === "square") {
        if (endValue > startVar1) {
          varToManipulate = "e"
        } else if (startVar1 > endValue) {
          varToManipulate = "i"
        }
      } else if (endManipulation.type === "mult") {
        if (endValue > startVar1) {
          varToManipulate = "e"
        } else if (startVar1 > endValue) {
          varToManipulate = "i"
        }
      } else if (endManipulation.type === "log") {
        if (endValue > startVar1) {
          varToManipulate = "e"
        } else if (startVar1 > endValue) {
          varToManipulate = "i"
        }
      }
    } else if (vars === "xy" || vars === "yx") {
      if (endManipulation.type === "square") {
        if (startVar2 > startVar1) {
          varToManipulate = "j"
        } else if (startVar1 > startVar2) {
          varToManipulate = "i"
        }
      } else if (endManipulation.type === "mult") {
        if (startVar2 > startVar1) {
          varToManipulate = "j"
        } else if (startVar1 > startVar2) {
          varToManipulate = "i"
        }
      } else if (endManipulation.type === "log") {
        if (startVar2 > startVar1) {
          varToManipulate = "j"
        } else if (startVar1 > startVar2) {
          varToManipulate = "i"
        }
      }
    }
  }
  return varToManipulate
}
