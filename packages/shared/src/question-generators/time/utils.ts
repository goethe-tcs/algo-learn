import {
  printStarsNew,
  type PseudoCodeAssignment,
  type PseudoCodeBlock,
  type PseudoCodeFor,
  type PseudoCodeForAll,
  type PseudoCodeIf,
  type PseudoCodeString,
  type PseudoCodeVariable,
  type PseudoCodeWhile,
} from "../../utils/pseudoCodeUtils.ts"
import type Random from "../../utils/random.ts"

export type AdditionOption = { type: "add"; value: number }
export type MultiplicationOption = { type: "mult"; value: number }
export type DivisionOption = { type: "div"; value: number }
export type SquareOption = { type: "square"; abs: boolean }
export type CubeOption = { type: "cube" }
export type LogOption = { type: "log"; value: number }
export type RootOption = { type: "root" } // can we display the fifth root of n in pseudocode?
export type PowOption = { type: "pow"; value: number | "self" }

export type BoundsOptions =
  | "none"
  | AdditionOption
  | MultiplicationOption
  | SquareOption
  | CubeOption
  | LogOption
  | RootOption
  | DivisionOption
  | PowOption

export type IfOptions = "none" | "even" | "odd" | "square" | "same" | ">" | "<"

export type WhileOrderOptions = "xy" | "yx" | "xn"
export type WhileCompareOptions = "==" | "<" | ">" | "<=" | ">="

// Here already as an array for faster access to random.choice
export const allWhileCases: string[] = [
  // cases for only X
  "xPlus", // increases first var with an addition
  "xMult", // increases first var with a multiplication
  "xSquare", // increases first var by squaring
  "xMinus", // decreases first var with a subtraction
  "xDiv", // decreases first var with a division
  "xLog", // decreases first var by log2(...)
  "xPlusX", // increases first var by doubling it (like x*2, but instead x+x)
  // cases where Y manipulates X
  "xPlusY", // increases first var with an addition of second var
  "xMultY", // increases first var with a multiplication of second var
  "xDivY", // decreases first var with a division of second var
  "xMinusY", // decreases first var with a subtraction of second var
  // cases where both change, but different directions
  "xMinusYPlus", // first var decreases, second var increases (by subtraction and addition)
  "xMinusYMult", // first var decreases, second var increases (by subtraction and multiplication)
  "xDivYPlus", // first var decreases, second var increases (by division and addition)
  "xDivYMult", // first var decreases, second var increases (by division and multiplication)
  "xMinusYYPlus", // first var decreases, second var decreases (first var - second var and second var by addition)
  // cases where both change but same direction,
  // but one var should move faster than the other,
  // this is controlled in whileCreatePseudo
  "bothPlus", // both increases (addition)
  "bothMult", // both increases (multiplication)
  "bothMinus", // both decreases (subtraction)
]

export function getCompare(random: Random, com: "<" | ">" | "<<" | ">>"): WhileCompareOptions {
  if (com === "<") {
    return random.weightedChoice([
      ["<", 0.49],
      ["<=", 0.49],
      ["==", 0.02],
    ])
  }
  if (com === ">") {
    return random.weightedChoice([
      [">", 0.49],
      [">=", 0.49],
      ["==", 0.02],
    ])
  }
  if (com === "<<") {
    return random.choice(["<", "<="])
  }
  return random.choice([">", ">="])
}

/**
 * Creates a basic for loop line when no step set is provided
 * @param variableName
 * @param startValueLoop
 * @param startManipulation
 * @param endValueLoop
 * @param endManipulation
 * @param timeOrStars (if used to print stars or to determine the running time of code)
 */
export function createBasicForLine({
  variableName,
  startValueLoop,
  startManipulation = "none",
  endValueLoop,
  endManipulation = "none",
  timeOrStars = "stars",
}: {
  variableName: string
  startValueLoop: string | PseudoCodeVariable
  startManipulation?: BoundsOptions
  endValueLoop: string
  endManipulation?: BoundsOptions
  timeOrStars?: "time" | "stars"
}): PseudoCodeFor {
  const startString = createBoundsString(startValueLoop, startManipulation, timeOrStars)
  const endString = createBoundsString(endValueLoop, endManipulation, timeOrStars)
  return {
    for: {
      variable: variableName,
      from: startString,
      to: endString,
      do: null,
    },
  }
}

/**
 * Creates a for loop line when a step set is provided
 * @param variableName
 * @param stepValuesSet
 */
export function createForLineWithStepSet({
  variableName,
  stepValuesSet,
}: {
  variableName: string
  stepValuesSet: string
}): PseudoCodeForAll {
  return {
    forAll: {
      variable: variableName,
      set: [stepValuesSet],
      do: null,
    },
  }
}

/**
 * Creates a while loop line
 * @param start
 * @param startManipulation
 * @param end
 * @param endManipulation
 * @param compare
 * @param timeOrStars
 * @param indent
 */
export function createWhileLine({
  start,
  startManipulation = "none",
  end,
  endManipulation = "none",
  compare,
  timeOrStars = "stars",
}: {
  start: string | PseudoCodeVariable
  startManipulation?: BoundsOptions
  end: string | PseudoCodeVariable
  endManipulation?: BoundsOptions
  compare: string
  timeOrStars?: "time" | "stars"
}): PseudoCodeWhile {
  // if compare = "==", we just return start compare end without manipulation
  if (compare === "==") {
    return {
      while: {
        condition: [start, compare, end],
        do: null,
      },
    }
  }

  const startBounds = createBoundsString(start, startManipulation, timeOrStars)
  const endBounds = createBoundsString(end, endManipulation, timeOrStars)

  return {
    while: {
      condition: [...startBounds, compare, ...endBounds],
      do: null,
    },
  }
}

/**
 * Creates a string how to manipulate the bounds (of a for loop or while loop)
 * @param value
 * @param boundsManipulation
 * @param timeOrStars
 */
export function createBoundsString(
  value: string | PseudoCodeVariable,
  boundsManipulation: BoundsOptions,
  timeOrStars?: "time" | "stars",
) {
  // create the bounds string
  let endPseudoCodeString: PseudoCodeString = [value]
  if (boundsManipulation !== "none") {
    if (boundsManipulation.type === "mult") {
      endPseudoCodeString = [`${boundsManipulation.value} \\cdot `, value]
    }
    if (boundsManipulation.type === "square") {
      if (timeOrStars === "stars" && boundsManipulation.abs) {
        endPseudoCodeString = [value, " \\cdot \\left| ", value, " \\right| "]
      } else {
        endPseudoCodeString = [value, "^2"]
      }
    }
    if (boundsManipulation.type === "cube") {
      endPseudoCodeString = [value, "^3"]
    }
    if (boundsManipulation.type === "log") {
      if (timeOrStars === "stars") {
        endPseudoCodeString = [`\\lceil log_${boundsManipulation.value}(`, value, `) \\rceil`]
      } else {
        endPseudoCodeString = [
          `log${boundsManipulation.value === 0 ? "" : "_" + boundsManipulation.value}(`,
          value,
          `)`,
        ]
      }
    }
    if (boundsManipulation.type === "root") {
      if (timeOrStars === "stars") {
        endPseudoCodeString = [`\\lfloor \\sqrt{`, value, `} \\rfloor`]
      } else {
        endPseudoCodeString = [`\\sqrt{`, value, `}`]
      }
    }
    if (boundsManipulation.type === "div") {
      if (timeOrStars === "stars") {
        endPseudoCodeString = [`\\lfloor \\frac{`, value, `}{${boundsManipulation.value}} \\rfloor`]
      } else {
        endPseudoCodeString = [`\\frac{`, value, `}{${boundsManipulation.value}}`]
      }
    }
    if (boundsManipulation.type === "pow") {
      endPseudoCodeString = [
        boundsManipulation.value === "self" ? value : boundsManipulation.value.toString(),
        "^",
        value,
      ]
    }
    if (boundsManipulation.type === "add") {
      endPseudoCodeString = [
        value,
        boundsManipulation.value > 0 ? "+" : "",
        boundsManipulation.value.toString(),
      ]
    }
  }
  return endPseudoCodeString
}

/**
 * Creates an if condition
 * @param firstVariableName
 * @param secondVariableName
 * @param condition
 * @param elseStatement
 * @param numPrint
 * @param numPrintElse
 * @param writeCode if other code (other than printStars) should be written inside the if statement
 */
export function createIfCondition({
  firstVariableName,
  secondVariableName = "none",
  condition,
  elseStatement = false,
  numPrint = 0,
  numPrintElse = 0,
  writeCode = "",
}: {
  firstVariableName: string
  secondVariableName?: string
  condition: IfOptions
  elseStatement?: boolean
  numPrint?: number
  numPrintElse?: number
  writeCode?: string
}): PseudoCodeIf {
  if (condition === "none") {
    throw new Error("There should not be an if condition with none.")
  }

  let formattedCondition: PseudoCodeString
  if (condition === "same" || condition === ">" || condition === "<") {
    formattedCondition = [
      { variable: firstVariableName },
      `${condition === "same" ? "==" : condition}`,
      { variable: secondVariableName },
    ]
  } else {
    formattedCondition = [{ variable: firstVariableName }, `\\text{ is ${condition}}`]
  }

  const thenStatement: PseudoCodeBlock = {
    block: [],
  }
  if (numPrint > 0) {
    thenStatement.block.push(printStarsNew(numPrint))
  }
  if (writeCode !== "") {
    thenStatement.block.push({
      state: [writeCode],
    })
  }

  const ifStatement: PseudoCodeIf = {
    if: {
      condition: formattedCondition,
      then: thenStatement,
    },
  }

  if (elseStatement) {
    ifStatement.if.else = {
      block: [printStarsNew(numPrintElse)],
    }
  }

  return ifStatement
}

/**
 * Creates the comparing of while loops
 * - Either creates code
 * - Or returns the new values of the inner variables (changeI, changeJ)
 * @param cOption
 * @param firstChangeValue
 * @param secondChangeValue
 * @param firstVariableName
 * @param secondVariableName
 * @param code
 * @param compare
 * @param vars
 * @param changeCode
 * @param changeFirstVariable
 * @param changeSecondVariable
 * @param random
 */
export function createWhileChangeValues({
  cOption,
  firstChangeValue,
  secondChangeValue,
  firstVariableName = "nan",
  secondVariableName = "nan",
  compare,
  vars,
  changeCode = true,
  changeFirstVariable = 0,
  changeSecondVariable = 0,
  random,
}: {
  cOption: string
  firstChangeValue: number
  secondChangeValue: number
  firstVariableName?: string
  secondVariableName?: string
  compare: WhileCompareOptions
  vars: WhileOrderOptions
  changeCode?: boolean
  changeFirstVariable?: number
  changeSecondVariable?: number
  random: Random
}) {
  const assignments: PseudoCodeAssignment[] = []
  if (cOption === "xPlus") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "+", firstChangeValue.toString()],
    })
    changeFirstVariable += firstChangeValue
  } else if (cOption === "xMult") {
    if (changeCode) firstChangeValue = random.int(2, 3)
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, " \\cdot ", firstChangeValue.toString()],
    })
    changeFirstVariable *= firstChangeValue
  } else if (cOption === "xSquare") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "^2"],
    })
    changeFirstVariable *= changeFirstVariable
  } else if (cOption === "xPlusX") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "+", { variable: firstVariableName }],
    })
    changeFirstVariable += changeFirstVariable
  } else if (cOption === "xMinus") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "-", firstChangeValue.toString()],
    })
    changeFirstVariable -= firstChangeValue
  } else if (cOption === "xDiv") {
    if (changeCode) firstChangeValue = random.int(2, 3)
    assignments.push({
      assignment: firstVariableName,
      value: [
        "\\lfloor \\frac{",
        { variable: firstVariableName },
        "}{",
        firstChangeValue.toString(),
        "} \\rfloor",
      ],
    })
    changeFirstVariable = Math.floor(changeFirstVariable / firstChangeValue)
  } else if (cOption === "xLog") {
    assignments.push({
      assignment: firstVariableName,
      value: ["\\lceil ", "log_2(", { variable: firstVariableName }, ")", "\\rceil"],
    })
    changeFirstVariable = Math.ceil(Math.log2(changeFirstVariable))
  } else if (cOption === "xMinusY") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "-", { variable: secondVariableName }],
    })
    changeFirstVariable -= changeSecondVariable
  } else if (cOption === "xDivY") {
    assignments.push({
      assignment: firstVariableName,
      value: [
        "\\lfloor \\frac{",
        { variable: firstVariableName },
        "}{",
        { variable: secondVariableName },
        "} \\rfloor",
      ],
    })
    changeFirstVariable = Math.floor(changeFirstVariable / changeSecondVariable)
  } else if (cOption === "xPlusY") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "+", { variable: secondVariableName }],
    })
    changeFirstVariable += changeSecondVariable
  } else if (cOption === "xMultY") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, " \\cdot ", { variable: secondVariableName }],
    })
    changeFirstVariable *= changeSecondVariable
  } else if (cOption === "xMinusYPlus") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "-", firstChangeValue.toString()],
    })
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, "+", secondChangeValue.toString()],
    })
    changeFirstVariable -= firstChangeValue
    changeSecondVariable += secondChangeValue
  } else if (cOption === "xDivYPlus") {
    if (changeCode) firstChangeValue = random.int(2, 3)
    assignments.push({
      assignment: firstVariableName,
      value: [
        "\\lfloor \\frac{",
        { variable: firstVariableName },
        "}{",
        firstChangeValue.toString(),
        "} \\rfloor",
      ],
    })
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, "+", secondChangeValue.toString()],
    })
    changeFirstVariable = Math.floor(changeFirstVariable / firstChangeValue)
    changeSecondVariable += secondChangeValue
  } else if (cOption === "xMinusYMult") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "-", firstChangeValue.toString()],
    })
    if (changeCode) secondChangeValue = random.int(2, 3)
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, " \\cdot ", secondChangeValue.toString()],
    })
    changeFirstVariable -= firstChangeValue
    changeSecondVariable *= secondChangeValue
  } else if (cOption === "xDivYMult") {
    if (changeCode) firstChangeValue = random.int(2, 3)
    assignments.push({
      assignment: firstVariableName,
      value: [
        "\\lfloor \\frac{",
        { variable: firstVariableName },
        "}{",
        firstChangeValue.toString(),
        "} \\rfloor",
      ],
    })
    if (changeCode) secondChangeValue = random.int(2, 3)
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, " \\cdot ", secondChangeValue.toString()],
    })
    changeFirstVariable = Math.floor(changeFirstVariable / firstChangeValue)
    changeSecondVariable *= secondChangeValue
  } else if (cOption === "xMinusYYPlus") {
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "-", { variable: secondVariableName }],
    })
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, "+", secondChangeValue.toString()],
    })
    changeFirstVariable -= changeSecondVariable
    changeSecondVariable += secondChangeValue
  } else if (cOption === "bothMinus") {
    if (
      (vars === "xy" && (compare === ">" || compare === ">=")) ||
      (vars === "yx" && (compare === "<" || compare === "<="))
    ) {
      if (changeCode) firstChangeValue = random.int(3, 4)
      if (changeCode) secondChangeValue = firstChangeValue - random.int(1, 2)
    } else {
      if (changeCode) secondChangeValue = random.int(3, 4)
      if (changeCode) firstChangeValue = secondChangeValue - random.int(1, 2)
    }
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "-", firstChangeValue.toString()],
    })
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, "-", secondChangeValue.toString()],
    })
    changeFirstVariable -= firstChangeValue
    changeSecondVariable -= secondChangeValue
  } else if (cOption === "bothPlus") {
    if (
      (vars === "xy" && (compare === ">" || compare === ">=")) ||
      (vars === "yx" && (compare === "<" || compare === "<="))
    ) {
      if (changeCode) firstChangeValue = random.int(1, 3)
      if (changeCode) secondChangeValue = firstChangeValue + random.int(1, 2)
    } else {
      if (changeCode) secondChangeValue = random.int(1, 3)
      if (changeCode) firstChangeValue = secondChangeValue + random.int(1, 2)
    }
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, "+", firstChangeValue.toString()],
    })
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, "+", secondChangeValue.toString()],
    })
    changeFirstVariable += firstChangeValue
    changeSecondVariable += secondChangeValue
  } else if (cOption === "bothMult") {
    if (
      (vars === "xy" && (compare === ">" || compare === ">=")) ||
      (vars === "yx" && (compare === "<" || compare === "<="))
    ) {
      if (changeCode) firstChangeValue = random.int(2, 3)
      if (changeCode) secondChangeValue = firstChangeValue + 1
    } else {
      if (changeCode) secondChangeValue = random.int(2, 3)
      if (changeCode) firstChangeValue = secondChangeValue + 1
    }
    assignments.push({
      assignment: firstVariableName,
      value: [{ variable: firstVariableName }, " \\cdot ", firstChangeValue.toString()],
    })
    assignments.push({
      assignment: secondVariableName,
      value: [{ variable: secondVariableName }, " \\cdot ", secondChangeValue.toString()],
    })
    changeFirstVariable *= firstChangeValue
    changeSecondVariable *= secondChangeValue
  }

  return {
    assignments,
    firstChangeValue,
    secondChangeValue,
    changeFirstVariable,
    changeSecondVariable,
  }
}
