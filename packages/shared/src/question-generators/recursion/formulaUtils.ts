import Fraction from "fraction.js"
import { log } from "mathjs"
import {
  printStarsNew,
  type PseudoCode,
  type PseudoCodeAssignment,
  type PseudoCodeBlock,
  type PseudoCodeCall,
  type PseudoCodeFunction,
  type PseudoCodeIf,
  type PseudoCodeReturn,
  type PseudoCodeState,
  type PseudoCodeString,
} from "../../utils/pseudoCodeUtils.ts"
import type Random from "../../utils/random.ts"
import { createProductTerm, type ProductTerm } from "../asymptotics/asymptoticsUtils.ts"

const arithmeticOperations = ["+", "-", "*", "/"]

/**
 * Produce a string of the form " print(***)"
 *
 * @param stars - Number of stars
 * @param indent - Number of spaces to indent
 * @returns - The string
 */
export function printStars(stars: number, indent: number): string {
  if (stars == 0) return ""
  else return `${" ".repeat(indent)}print("${"*".repeat(stars)}")\n`
}

export function sampleRecursiveFunction(divOrSub: "div" | "sub", random: Random) {
  const functionName = random.choice("fghPp".split(""))
  const variable = random.choice("nmNMxyztk".split(""))
  const sumVariable = random.choice("nmNMxyztk".split("").filter((x) => x !== variable))
  const preStars = random.int(0, 3)
  const baseStars = random.int(1, 4)
  const recStars = random.int(0, 3)
  const postStars = random.int(0, 3)
  const numRecCalls = random.int(1, 3)
  const divideOrSubtractBy = random.int(2, 7)

  const stars = random.choice([true, false])

  if (stars) {
    return sampleRecursiveFunctionStars({
      divOrSub,
      functionName,
      variable,
      preStars,
      baseStars,
      recStars,
      postStars,
      numRecCalls,
      divideOrSubtractBy,
    })
  }
  return sampleRecursiveFunctionArithmetic({
    divOrSub,
    random,
    functionName,
    variable,
    sumVariable,
    preStars,
    baseStars,
    recStars,
    numRecCalls,
    divideOrSubtractBy,
  })
}

/**
 * Sample the source code of a simple recursive procedure that prints stars
 *
 * @param divOrSub
 * @param functionName
 * @param variable
 * @param preStars
 * @param baseStars
 * @param recStars
 * @param postStars
 * @param numRecCalls
 * @param divideBy
 * @returns - Object containing the source code, the name of the function, the
 *   name of the variable, the number of stars printed in the base case and in
 *   the recursive case, as well as the number of recursive callsand the number
 *   to divide by.
 */
export function sampleRecursiveFunctionStars({
  divOrSub,
  functionName,
  variable,
  preStars,
  baseStars,
  recStars,
  postStars,
  numRecCalls,
  divideOrSubtractBy,
}: {
  divOrSub: "div" | "sub"
  functionName: string
  variable: string
  preStars: number
  baseStars: number
  recStars: number
  postStars: number
  numRecCalls: number
  divideOrSubtractBy: number
}) {
  const completeCode: PseudoCode = []
  const functionBodyBlock: PseudoCodeBlock = {
    block: [],
  }

  if (preStars > 0) {
    functionBodyBlock.block.push(printStarsNew(preStars))
  }

  const functionTextBase: PseudoCodeState = printStarsNew(baseStars)

  const functionRecCallsBlock: PseudoCodeBlock = {
    block: [],
  }

  if (recStars > 0) {
    functionRecCallsBlock.block.push(printStarsNew(recStars))
  }

  let recCallString: PseudoCodeString
  if (divOrSub === "div") {
    recCallString = [`\\frac{`, { variable: variable }, `}{${divideOrSubtractBy}}`]
  } else {
    recCallString = [{ variable: variable }, ` - ${divideOrSubtractBy}`]
  }
  for (let i = 0; i < numRecCalls; i++) {
    const functionCall: PseudoCodeCall = {
      functionName: functionName,
      args: [recCallString],
    }
    functionRecCallsBlock.block.push({ state: functionCall })
  }

  const functionTextIf: PseudoCodeIf = {
    if: {
      condition: [{ variable: variable }, ` \\leq 1`],
      then: functionTextBase,
      else: functionRecCallsBlock,
    },
  }
  functionBodyBlock.block.push(functionTextIf)

  if (postStars > 0) {
    functionBodyBlock.block.push(printStarsNew(postStars))
  }

  const functionDeclaration: PseudoCodeFunction = {
    name: functionName,
    args: [variable],
    body: functionBodyBlock,
  }

  completeCode.push(functionDeclaration)

  return {
    functionText: completeCode,
    functionName,
    n: variable,
    b: divideOrSubtractBy,
    a: numRecCalls,
    d: preStars + baseStars + postStars,
    c: preStars + recStars + postStars,
    type: "Stars",
  }
}

/**
 * Sample the source code of a simple recursive procedure that calculates some arithmetic operations
 *
 * Either T(n) = a T(n/b) + c; T(1) = d
 *     or T(n) = a T(n-b) + c; T(1) = d
 *
 * @param div - Whether to divide or subtract
 * @param random - Random number generator
 * @returns - Object containing the source code, the name of the function, the
 *   name of the variable, the number of arithmetic operations in the base case and in
 *   the recursive case, as well as the number of recursive calls and the number
 *   to divide by.
 */
export function sampleRecursiveFunctionArithmetic({
  divOrSub,
  random,
  functionName,
  variable,
  sumVariable,
  preStars,
  baseStars,
  recStars,
  numRecCalls,
  divideOrSubtractBy,
}: {
  divOrSub: "div" | "sub"
  random: Random
  functionName: string
  variable: string
  sumVariable: string
  preStars: number
  baseStars: number
  recStars: number
  numRecCalls: number
  divideOrSubtractBy: number
}) {
  const completeCode: PseudoCode = []

  const functionDeclaration: PseudoCodeFunction = {
    name: functionName,
    args: [variable],
    body: null,
  }
  const functionBodyBlock: PseudoCodeBlock = {
    block: [],
  }
  functionDeclaration.body = functionBodyBlock
  completeCode.push(functionDeclaration)

  const functionAssignmentPre: PseudoCodeAssignment = {
    assignment: sumVariable,
    value: [generateOperationsArithmetic(preStars, random)],
  }
  functionBodyBlock.block.push({ state: functionAssignmentPre })

  const functionTextIf: PseudoCodeIf = {
    if: {
      condition: [{ variable: variable }, ` \\leq 1`],
      then: null,
      else: null,
    },
  }
  functionBodyBlock.block.push(functionTextIf)

  const functionReturn1: PseudoCodeReturn = {
    returnValue: [generateOperationsArithmetic(baseStars, random)],
  }
  functionTextIf.if.then = { state: functionReturn1 }

  const functionRecCallsBlock: PseudoCodeBlock = {
    block: [],
  }
  functionTextIf.if.else = functionRecCallsBlock
  if (recStars > 0) {
    const functionAssignmentRec: PseudoCodeAssignment = {
      assignment: sumVariable,
      value: [generateOperationsArithmetic(recStars, random)],
    }
    functionRecCallsBlock.block.push({ state: functionAssignmentRec })
  }

  const { returnString } = generateRecursiveReturnArithmetic({
    numRecCalls,
    functionName,
    variable,
    divOrSub,
    divideOrSubtractBy,
    random,
  })
  const functionReturn2: PseudoCodeReturn = {
    returnValue: returnString,
  }
  functionRecCallsBlock.block.push({ state: functionReturn2 })

  return {
    functionText: completeCode,
    functionName,
    n: variable,
    b: divideOrSubtractBy,
    a: numRecCalls,
    d: preStars + baseStars,
    c: preStars + recStars + numRecCalls * 2 - 1, // reduce -1 because  h(t−7)−h(t−7) are 3 not 4 operations
    type: "Arithmetic",
  }
}

/**
 * Prints a recurrence relation for a recursive function of the form T(n) = a
 * T(n/b) + c; T(1) = d
 *
 * @returns Output
 */
export function recurrence({
  divOrSub,
  t,
  n,
  a,
  b,
  c,
  d,
}: {
  divOrSub: "div" | "sub"
  t: string
  n: string
  a: number
  b: number
  c: number
  d: number
}): string {
  const baseString = `${t}(1) = ${d}`
  const recString = `${t}(${n}) = ${a != 1 ? `${a} ` : ""}${t}(${n}${
    b != 1 ? ` ${divOrSub === "div" ? "/" : "-"} ${b}` : ""
  }) ${c != 0 ? ` + ${c}` : ""}`
  return `$${baseString}\\\\${recString}$`
}

/**
 * Sample a set of recurrence relations for a recursive function of the form
 * T(n) = a T(n/b) + c; T(1) = d
 *
 * @param props
 * @param props.random - Random number generator
 * @param props.t - The correct name of the function
 * @param props.n - The correct name of the variable
 * @param props.a - The correct coefficient of the recursive call
 * @param props.b - The correct divisor in the recursive call
 * @param props.c - The correct constant term
 * @param props.d - The correct value of the function in the base case
 * @returns Array of objects containing the key, whether it is correct, and the
 *   element to render
 */
export function sampleRecurrenceAnswers({
  random,
  divOrSub,
  t,
  n,
  a,
  b,
  c,
  d,
}: {
  random: Random
  divOrSub: "div" | "sub"
  t: string
  n: string
  a: number
  b: number
  c: number
  d: number
}): Array<{ key: string; correct: boolean; element: string }> {
  const answers: Array<{
    key: string
    correct: boolean
    element: string
  }> = []
  function tryAdding({
    a,
    b,
    c,
    d,
    correct = false,
  }: {
    a: number
    b: number
    c: number
    d: number
    correct?: boolean
  }) {
    const key = `${a}-${b}-${c}-${d}`
    if (answers.find((ans) => ans.key === key) === undefined) {
      const element = recurrence({ divOrSub, t: t, n, a, b, c, d })
      answers.push({ key, correct, element })
    }
  }
  tryAdding({ a, b, c, d, correct: true })

  for (let trials = 0; trials < 100 && answers.length < 4; trials++) {
    const ca = a + random.choice(a === 1 ? [0, 1] : [-1, 0, 1])
    const cb = b + random.choice(b === 1 ? [0, 1] : [-1, 0, 1])
    const cc = c + random.choice(c === 1 ? [0, 1] : [-1, 0, 1])
    const cd = d + random.choice(d === 1 ? [0, 1] : [-1, 0, 1])
    tryAdding({ a: ca, b: cb, c: cc, d: cd })
  }
  return random.shuffle(answers)
}

/**
 * Parse a recursive function of the form "a T(n/b) + c"
 *
 * @param input - The input string
 * @returns Object containing the parsed values
 * @throws {Error} If the input is invalid
 */
export function parseRecursiveFunction(input: string): {
  a: number
  t: string
  n: string
  b: number
  c: number
  divOrSub: "div" | "sub"
} {
  let divOrSub: "div" | "sub" = "div"
  const regexDiv =
    /^\s*(\d*)\s*\*?\s*([A-Za-z]+)\s*\(\s*([A-Za-z]+)\s*(?:\/\s*(\d+)\s*)?\)\s*(?:\+\s*(\d+)\s*)?$/
  const regexSub =
    /^\s*(\d*)\s*\*?\s*([A-Za-z]+)\s*\(\s*([A-Za-z]+)\s*(?:-\s*(\d+)\s*)?\)\s*(?:\+\s*(\d+)\s*)?$/
  let match = input.match(regexDiv)

  if (!match) {
    match = input.match(regexSub)
    divOrSub = "sub"
  }

  if (!match) {
    throw new Error("Invalid input format")
  }

  const a = match[1] ? parseInt(match[1], 10) : 1
  const t = match[2]
  const n = match[3]
  const b = match[4] ? parseInt(match[4], 10) : 1
  const c = match[5] ? parseInt(match[5], 10) : 0

  return { a, t: t, n, b, c, divOrSub }
}
/**
 * Sample a recursive function T(n) = a T(n/b) + c, T(1) = d that the master
 * theorem can be applied on.
 *
 * @param random - Random number generator
 * @returns - Returns the parameters a, b, c , d, the Theta asymptotic expression of the
 *   function, as well as which master theorem case is being used.
 */
export function sampleMasterRecursion(random: Random) {
  const base = random.int(2, 10)
  //get a random exponent, so that the power is below 150 for reasonable recursion functions.
  const result = base ** random.int(1, Math.floor(log(150, base)))
  let a = base
  let b = result
  if (random.int(0, 1) === 0) {
    ;[a, b] = [b, a]
  }
  a = random.weightedChoice([
    [a, 0.85],
    [1, 0.15],
  ])
  let c: ProductTerm
  const masterCase = a === 1 ? random.int(2, 3) : random.int(1, 3)
  let solution: ProductTerm
  const coefficient = random.int(2, 99)
  if (masterCase === 1) {
    const polyexponent = log(a, b) <= 1 ? new Fraction(1, Math.round(log(b, a)) + 1) : log(a, b) - 1
    c = createProductTerm({
      coefficient: coefficient,
      polyexponent: polyexponent,
    })
    solution = createProductTerm({
      coefficient: coefficient,
      polyexponent: log(a, b),
    })
  } else if (masterCase === 2) {
    c = createProductTerm({ coefficient: coefficient, polyexponent: log(a, b) })
    solution = createProductTerm({
      coefficient: coefficient,
      polyexponent: log(a, b),
      logexponent: 1,
    })
  } else {
    const polyexponent =
      a === 1
        ? random.choice([random.int(1, 2), new Fraction(1, random.int(2, 3))])
        : log(a, b) < 1
          ? new Fraction(random.int(1, 3), Math.max(Math.round(log(b, a)) - 1, 1))
          : log(a, b) + 1
    c = createProductTerm({
      coefficient: coefficient,
      polyexponent: polyexponent,
    })
    solution = c
  }
  return {
    b: b,
    a: a,
    c: c,
    d: random.int(2, 9),
    solution: solution,
    masterCase: masterCase,
  }
}
/**
 * Sample a set of Theta expressions. The expressions are: Theta(n^log_b(a)),
 * Theta(n^log_b(a) * log(n)), Theta(c) and Theta(c * log(n)) If c = n^logb(a)
 * (master theorem case 2) then Theta(c) and Theta(c * log(n)) get randomized.
 *
 * @returns Array of objects containing the key, whether it is correct, and the
 *   element to render
 */
export function sampleMasterRecursionAnswers({
  random,
  masterCase,
  a,
  b,
  c,
}: {
  random: Random
  masterCase: number
  a: number
  b: number
  c: ProductTerm
}): Array<{ key: string; correct: boolean; element: string }> {
  const answers: Array<{
    key: string
    correct: boolean
    element: string
  }> = []
  function runningTime(a: number, b: number) {
    return log(a, b) === 0
      ? "1"
      : log(a, b) === 1
        ? "n"
        : log(a, b) >= 1
          ? `n^${Math.round(log(a, b))}`
          : createProductTerm({
              coefficient: 1,
              polyexponent: new Fraction(1, Math.round(log(b, a))),
            }).toLatex("n")
  }
  answers.push({
    key: "1",
    correct: masterCase === 1,
    element: `\\Theta(${runningTime(a, b)})`,
  })
  answers.push({
    key: "2",
    correct: masterCase === 2,
    element: `\\Theta(${log(a, b) === 0 ? "" : runningTime(a, b)} \\log(n))`,
  })
  let secondTerm = createProductTerm({
    coefficient: new Fraction(1),
    polyexponent: c.logarithmExponents.get(0),
  }).toLatex("n")
  if (masterCase === 2) {
    secondTerm =
      log(a, b) === 0
        ? "n"
        : log(a, b) === 1
          ? "n^2"
          : log(a, b) >= 1
            ? createProductTerm({
                coefficient: 1,
                polyexponent: Math.round(log(a, b)) + random.choice([-1, 1]),
              }).toLatex("n")
            : createProductTerm({
                coefficient: 1,
                polyexponent: new Fraction(
                  random.int(1, 2),
                  Math.round(log(b, a)) + random.choice([-1, 1]),
                ),
              }).toLatex("n")
  }
  answers.push({
    key: "3",
    correct: masterCase === 3,
    element: `\\Theta(${secondTerm})`,
  })
  answers.push({
    key: "4",
    correct: false,
    element: `\\Theta(${secondTerm === "1" ? "" : secondTerm} \\log(n))`,
  })
  return random.shuffle(answers)
}

function generateOperationsArithmetic(stars: number, random: Random) {
  // we need to create as many arithmetic operations as the number of stars
  const firstNumberValue = random.int(1, 9)
  let equationString = firstNumberValue.toString()
  let lastOperationWasFraction = false
  for (let i = 0; i < stars; i++) {
    let operation = random.choice(arithmeticOperations)
    if (lastOperationWasFraction) {
      lastOperationWasFraction = false
      operation = random.choice(arithmeticOperations.filter((op) => op !== "/"))
    }
    const currentNumber = random.int(1, 9)
    if (operation === "*") {
      operation = "\\cdot "
    } else if (operation === "/") {
      lastOperationWasFraction = true
      equationString = equationString.trim()
      equationString =
        equationString.slice(0, equationString.length - 1) +
        `\\frac{${equationString[equationString.length - 1]}}{${currentNumber}} `
      continue
    }
    equationString += `${operation} ${currentNumber} `
  }

  return equationString
}

function generateRecursiveReturnArithmetic({
  numRecCalls,
  functionName,
  variable,
  divOrSub,
  divideOrSubtractBy,
  random,
}: {
  numRecCalls: number
  functionName: string
  variable: string
  divOrSub: "div" | "sub"
  divideOrSubtractBy: number
  random: Random
}) {
  const returnString: PseudoCodeString = []
  for (let i = 0; i < numRecCalls; i++) {
    returnString.push({ functionName: functionName }, `(`)
    if (divOrSub === "sub") {
      returnString.push(...[{ variable: variable }, ` - ${divideOrSubtractBy})`])
    } else {
      returnString.push(...[`\\frac{`, { variable: variable }, `}{${divideOrSubtractBy}})`])
    }
    if (i < numRecCalls - 1) {
      const chooseOperation = random.choice(arithmeticOperations.filter((op) => op !== "/"))
      returnString.push(`${chooseOperation === "*" ? "\\cdot " : chooseOperation} `)
    }
  }
  return { returnString }
}
