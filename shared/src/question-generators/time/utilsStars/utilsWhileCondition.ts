import { BoundsOptions } from "@shared/question-generators/time/utils.ts"

/**
 * This function compare two values for var1 and var2 inside a while loop
 * it returns true if the condition is met, so the loop can continue
 * otherwise false
 * @param i
 * @param j
 * @param compare
 */
function compareTwoValues(i: number, j: number, compare: string) {
  if (compare === "<") {
    return i < j
  } else if (compare === "<=") {
    return i <= j
  } else if (compare === ">") {
    return i > j
  } else if (compare === ">=") {
    return i >= j
  } else {
    return i === j
  }
}

/**
 * This function will manipulate the variable based on the variable name and the end manipulation
 * @param variable
 * @param varName
 * @param varToManipulate
 * @param endManipulation
 */
function manipulateVariable(
  variable: number,
  varName: "i" | "j" | "e",
  varToManipulate: string,
  endManipulation: BoundsOptions,
): number {
  if (varToManipulate !== varName || endManipulation === "none") {
    return variable
  }

  switch (endManipulation.type) {
    case "square":
      return Math.abs(variable) * variable
    case "mult":
      return variable * endManipulation.value
    default:
      return Math.ceil(Math.log2(variable))
  }
}

/**
 * This function will compare two variables based on the variable order
 * and the compare option and return true if the condition is met otherwise false
 * @param i
 * @param j
 * @param varToManipulate
 * @param variableOrder
 * @param compareOption
 * @param endValue
 * @param endManipulation
 */
export function conditionCheck(
  i: number,
  j: number,
  varToManipulate: "i" | "j" | "e" | "",
  variableOrder: "xy" | "yx" | "xn",
  compareOption: string,
  endValue: number,
  endManipulation: BoundsOptions,
) {
  const manipulatedI = manipulateVariable(i, "i", varToManipulate, endManipulation)
  const manipulatedJ = manipulateVariable(j, "j", varToManipulate, endManipulation)
  const manipulatedE = manipulateVariable(endValue, "e", varToManipulate, endManipulation)

  switch (variableOrder) {
    case "xy":
      return compareTwoValues(manipulatedI, manipulatedJ, compareOption)
    case "yx":
      return compareTwoValues(manipulatedJ, manipulatedI, compareOption)
    case "xn":
      return compareTwoValues(manipulatedI, manipulatedE, compareOption)
    default:
      return false
  }
}
