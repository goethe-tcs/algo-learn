import {
  BoundsOptions,
  createBasicForLine,
  createForLineWithStepSet,
  createIfCondition,
  IfOptions,
} from "@shared/question-generators/time/utils.ts"
import {
  printStarsNew,
  PseudoCode,
  PseudoCodeBlock,
  PseudoCodeFor,
  PseudoCodeForAll,
  PseudoCodeVariable,
} from "@shared/utils/pseudoCodeUtils.ts"

/**
 * This creates the pseudoCode for the first for loop of the for-for loop
 * @param stepValueFirstLoop
 * @param firstVariableName
 * @param startValueFirstLoop
 * @param endValueFirstLoop
 * @param endManipulationFirstLoop
 * @param leadingPseudoCodeBlock
 */
function createFirstForLine(
  stepValueFirstLoop: number,
  firstVariableName: string,
  startValueFirstLoop: number,
  endValueFirstLoop: number,
  endManipulationFirstLoop: BoundsOptions,
  leadingPseudoCodeBlock: PseudoCodeBlock,
) {
  let firstForLoop: PseudoCodeFor | PseudoCodeForAll
  if (stepValueFirstLoop === 1) {
    // Generate the pseudocode
    firstForLoop = createBasicForLine({
      variableName: firstVariableName,
      startValueLoop: startValueFirstLoop.toString(),
      startManipulation: "none",
      endValueLoop: endValueFirstLoop.toString(),
      endManipulation: endManipulationFirstLoop,
    })
    leadingPseudoCodeBlock.block.push(firstForLoop)
  } else {
    const stepValuesSet = createStepValuesSet({
      startValue: startValueFirstLoop,
      endValue: endValueFirstLoop,
      stepValue: stepValueFirstLoop,
      endManipulationLoop: endManipulationFirstLoop,
    })
    firstForLoop = createForLineWithStepSet({
      variableName: firstVariableName,
      stepValuesSet,
    })
    leadingPseudoCodeBlock.block.push(firstForLoop)
  }
  return firstForLoop
}

/**
 * This creates the pseudoCode for the second for loop of the for-for loop
 * @param startValueSecondLoop
 * @param startManipulationSecondLoop
 * @param firstVariableName
 * @param startSecondManipulationMultiplier
 * @param stepValueSecondLoop
 * @param secondVariableName
 * @param endValueSecondLoop
 * @param endManipulationSecondLoop
 * @param firstForBlock
 */
function createSecondForLine(
  startValueSecondLoop: number,
  startManipulationSecondLoop: "none" | "var-normal" | "var-mult" | "var-square",
  firstVariableName: string,
  startSecondManipulationMultiplier: number,
  stepValueSecondLoop: number,
  secondVariableName: string,
  endValueSecondLoop: number,
  endManipulationSecondLoop: BoundsOptions,
  firstForBlock: PseudoCodeBlock,
) {
  let startManipulation: BoundsOptions = "none"
  let startValue: string | PseudoCodeVariable = startValueSecondLoop.toString()
  if (startManipulationSecondLoop === "var-normal") {
    startValue = { variable: firstVariableName }
  } else if (startManipulationSecondLoop === "var-mult") {
    startValue = { variable: firstVariableName }
    startManipulation = { type: "mult", value: startSecondManipulationMultiplier }
  } else if (startManipulationSecondLoop === "var-square") {
    startValue = { variable: firstVariableName }
    // we'll only have positive numbers so abs is not necessary
    startManipulation = { type: "square", abs: false }
  }
  let secondForStatement: PseudoCodeFor | PseudoCodeForAll
  if (stepValueSecondLoop === 1) {
    secondForStatement = createBasicForLine({
      variableName: secondVariableName,
      startValueLoop: startValue,
      startManipulation: startManipulation,
      endValueLoop: endValueSecondLoop.toString(),
      endManipulation: endManipulationSecondLoop,
    })
    firstForBlock.block.push(secondForStatement)
  } else {
    const stepSet = createStepValuesSet({
      startValue: startValueSecondLoop,
      endValue: endValueSecondLoop,
      stepValue: stepValueSecondLoop,
      endManipulationLoop: endManipulationSecondLoop,
    })
    secondForStatement = createForLineWithStepSet({
      variableName: secondVariableName,
      stepValuesSet: stepSet,
    })
    firstForBlock.block.push(secondForStatement)
  }
  return secondForStatement
}

/**
 * This function creates the pseudocode for a for loop
 * Not complete docstring
 * for more detailed explanation see the functions below (like: generateForForRandomVariables)
 */
export function createPseudoCodeForForLoop(
  stepValueFirstLoop: number,
  firstVariableName: string,
  startValueFirstLoop: number,
  endValueFirstLoop: number,
  endManipulationFirstLoop: BoundsOptions,
  printStarsBetweenLoops: boolean,
  numPrintBetweenLoops: number,
  conditionFirstLoop: IfOptions,
  elseFirstLoop: boolean,
  numPrintSecondCondition: number,
  numPrintSecondElse: number,
  startValueSecondLoop: number,
  startManipulationSecondLoop: "none" | "var-normal" | "var-mult" | "var-square",
  startSecondManipulationMultiplier: number,
  stepValueSecondLoop: number,
  secondVariableName: string,
  endValueSecondLoop: number,
  endManipulationSecondLoop: BoundsOptions,
  askFirstVariableInSecondLoop: boolean,
  conditionSecondLoop: IfOptions,
  elseSecondLoop: boolean,
  numPrint: number,
  numPrintElse: number,
  printStarsAfterBothLoops: boolean,
  numPrintAfterAll: number,
) {
  const pseudoCode: PseudoCode = []
  const leadingPseudoCodeBlock: PseudoCodeBlock = {
    block: [],
  }
  pseudoCode.push(leadingPseudoCodeBlock)

  const firstForLoop = createFirstForLine(
    stepValueFirstLoop,
    firstVariableName,
    startValueFirstLoop,
    endValueFirstLoop,
    endManipulationFirstLoop,
    leadingPseudoCodeBlock,
  )

  const firstForBlock: PseudoCodeBlock = {
    block: [],
  }
  if ("forAll" in firstForLoop) {
    firstForLoop.forAll.do = firstForBlock
  } else {
    firstForLoop.for.do = firstForBlock
  }
  if (printStarsBetweenLoops) {
    firstForBlock.block.push(printStarsNew(numPrintBetweenLoops))
  }

  if (conditionFirstLoop !== "none") {
    const ifForStatementMiddle = createIfCondition({
      firstVariableName: firstVariableName,
      condition: conditionFirstLoop,
      elseStatement: elseFirstLoop,
      numPrint: numPrintSecondCondition,
      numPrintElse: numPrintSecondElse,
    })
    firstForBlock.block.push(ifForStatementMiddle)
  } else {
    // if the condition is none (we still want to print stars) in this case
    firstForBlock.block.push(printStarsNew(numPrintSecondCondition))
  }

  const secondForStatement = createSecondForLine(
    startValueSecondLoop,
    startManipulationSecondLoop,
    firstVariableName,
    startSecondManipulationMultiplier,
    stepValueSecondLoop,
    secondVariableName,
    endValueSecondLoop,
    endManipulationSecondLoop,
    firstForBlock,
  )

  const secondForBlock: PseudoCodeBlock = {
    block: [],
  }
  if ("forAll" in secondForStatement) {
    secondForStatement.forAll.do = secondForBlock
  } else {
    secondForStatement.for.do = secondForBlock
  }

  // create if inside the second for loop
  let askVar = `${secondVariableName}`
  if (askFirstVariableInSecondLoop) {
    askVar = `${firstVariableName}`
  }
  if (conditionSecondLoop !== "none") {
    const secondIfStatement = createIfCondition({
      firstVariableName: askVar,
      secondVariableName: askVar === firstVariableName ? secondVariableName : firstVariableName,
      condition: conditionSecondLoop,
      elseStatement: elseSecondLoop,
      numPrint,
      numPrintElse,
    })
    secondForBlock.block.push(secondIfStatement)
  } else {
    // if there is no if condition we still want to print stars (empty second for loop doesn't make sense)
    secondForBlock.block.push(printStarsNew(numPrint))
  }
  if (printStarsAfterBothLoops) {
    // not inside any loop
    leadingPseudoCodeBlock.block.push(printStarsNew(numPrintAfterAll))
  }
  return pseudoCode
}

/**
 * This function creates the step set for the for loop
 * The step set is a set of values with dots to indicate the iteration range
 * @param startValue
 * @param endValue
 * @param stepValue
 * @param endManipulationLoop
 */
function createStepValuesSet({
  startValue,
  endValue,
  stepValue,
  endManipulationLoop,
}: {
  startValue: number
  endValue: number
  stepValue: number
  endManipulationLoop: BoundsOptions
}) {
  if (endManipulationLoop === "none") {
    let stepSet = "\\{"
    for (let i = startValue; i <= endValue; i += stepValue) {
      if (i + stepValue <= endValue) {
        stepSet += i.toString() + ", "
      } else {
        stepSet += i.toString() + "\\}"
      }
    }
    return stepSet
  } else {
    let stepSet = `\\{${startValue}, ${startValue + stepValue}, ${startValue + 2 * stepValue}, \\dots, `
    if (endManipulationLoop.type === "square") {
      let rowEndNumber = startValue
      while (rowEndNumber + stepValue <= endValue * endValue) {
        rowEndNumber += stepValue
      }
      // Calculate the difference
      const difference = rowEndNumber - endValue * endValue
      // Create the stepSet string
      stepSet += `${endValue}^2 ${difference < 0 ? difference.toString() : ""}\\}`
    } else if (endManipulationLoop.type === "mult") {
      let rowEndNumber = startValue
      while (rowEndNumber + stepValue <= endValue * endManipulationLoop.value) {
        rowEndNumber += stepValue
      }
      const difference = rowEndNumber - endValue * endManipulationLoop.value
      stepSet += `${endValue}\\cdot${endManipulationLoop.value} ${difference < 0 ? difference.toString() : ""}\\}`
    } else {
      throw new Error("No other manipulation for endFirstManipulation")
    }

    return stepSet
  }
}
