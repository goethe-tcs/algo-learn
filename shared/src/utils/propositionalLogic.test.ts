import { describe, expect, test } from "vitest"
import {
  associativeOperators,
  BinaryOperatorType,
  Literal,
  Operator,
  ParserError,
  PropositionalLogicParser,
} from "./propositionalLogic"
import Random, { sampleRandomSeed } from "./random.ts"

const v = [new Literal("x1"), new Literal("x2"), new Literal("x3")]
const notV = [new Literal("x1", true), new Literal("x2", true), new Literal("x3", true)]

describe("operators", () => {
  test("not", () => {
    const expression = notV[0]
    expect(expression.eval({ x1: false })).toStrictEqual(true)
    expect(expression.eval({ x1: true })).toStrictEqual(false)
  })

  test("and", () => {
    const expression = new Operator("\\and", v[0], v[1])
    expect(expression.eval({ x1: false, x2: false })).toStrictEqual(false)
    expect(expression.eval({ x1: false, x2: true })).toStrictEqual(false)
    expect(expression.eval({ x1: true, x2: false })).toStrictEqual(false)
    expect(expression.eval({ x1: true, x2: true })).toStrictEqual(true)
  })

  test("or", () => {
    const expression = new Operator("\\or", v[0], v[1])
    expect(expression.eval({ x1: false, x2: false })).toStrictEqual(false)
    expect(expression.eval({ x1: false, x2: true })).toStrictEqual(true)
    expect(expression.eval({ x1: true, x2: false })).toStrictEqual(true)
    expect(expression.eval({ x1: true, x2: true })).toStrictEqual(true)
  })

  test("xor", () => {
    const expression = new Operator("\\xor", v[0], v[1])
    expect(expression.eval({ x1: false, x2: false })).toStrictEqual(false)
    expect(expression.eval({ x1: false, x2: true })).toStrictEqual(true)
    expect(expression.eval({ x1: true, x2: false })).toStrictEqual(true)
    expect(expression.eval({ x1: true, x2: true })).toStrictEqual(false)
  })

  test("implication", () => {
    const expression = new Operator("=>", v[0], v[1])
    expect(expression.eval({ x1: false, x2: false })).toStrictEqual(true)
    expect(expression.eval({ x1: false, x2: true })).toStrictEqual(true)
    expect(expression.eval({ x1: true, x2: false })).toStrictEqual(false)
    expect(expression.eval({ x1: true, x2: true })).toStrictEqual(true)
  })

  test("equality", () => {
    const expression = new Operator("<=>", v[0], v[1])
    expect(expression.eval({ x1: false, x2: false })).toStrictEqual(true)
    expect(expression.eval({ x1: false, x2: true })).toStrictEqual(false)
    expect(expression.eval({ x1: true, x2: false })).toStrictEqual(false)
    expect(expression.eval({ x1: true, x2: true })).toStrictEqual(true)
  })
})

test("eval", () => {
  const expression = new Operator("\\and", new Operator("\\and", v[0], v[1]), notV[2])
  expect(expression.eval({ x1: true, x2: true, x3: true })).toEqual(false)
  expect(expression.eval({ x1: true, x2: true, x3: false })).toEqual(true)
})

describe("toString", () => {
  test("basic", () => {
    expect(v[0].toString()).toBe("x1")

    const expression = new Operator("\\and", new Operator("\\or", v[0], v[1]), notV[2])
    expect(expression.toString()).toBe("(x1 \\or x2) \\and \\not x3")
  })

  describe("no unnecessary parenthesis", () => {
    for (const x of associativeOperators) {
      test(x, () => {
        const expression = new Operator(x, new Operator(x, v[0], v[1]), notV[2])
        expect(expression.toString()).toBe(`x1 ${x} x2 ${x} \\not x3`)
      })
    }
  })
})

test("variable names", () => {
  const expression = new Operator("=>", new Operator("\\xor", v[1], notV[0]), v[0])
  const variableNames = expression.getVariableNames()

  expect(variableNames).toEqual([v[0].name, v[1].name])
  expect(variableNames.length).toEqual(2)
})

test("truth table", () => {
  const expression = new Operator("\\xor", v[0], v[1])
  const { truthTable } = expression.getTruthTable()
  expect(Object.keys(truthTable).length).toEqual(4)
  expect(truthTable).toEqual([false, true, true, false])
})

describe("normal forms", () => {
  test("literals", () => {
    expect(v[0].isDisjunction()).toEqual(true)
    expect(v[0].isCNF()).toEqual(true)
    expect(notV[0].isDisjunction()).toEqual(true)
    expect(notV[0].isCNF()).toEqual(true)
  })

  describe("CNF", () => {
    const disjunction = new Operator("\\or", new Operator("\\or", v[0], notV[2]), v[1])
    const cnf = new Operator("\\and", disjunction, disjunction)
    test("single disjunction", () => {
      expect(disjunction.isDisjunction()).toEqual(true)
      expect(disjunction.isCNF()).toEqual(true)
    })
    test("full CNF", () => {
      expect(cnf.isConjunction()).toEqual(false)
      expect(cnf.isCNF()).toEqual(true)
      expect(cnf.isDisjunction()).toEqual(false)
      expect(cnf.isDNF()).toEqual(false)
    })
  })

  describe("DNF", () => {
    const conjunction = new Operator("\\and", new Operator("\\and", v[0], notV[2]), v[1])
    const dnf = new Operator("\\or", conjunction, conjunction)
    test("single conjunction", () => {
      expect(conjunction.isConjunction()).toEqual(true)
      expect(conjunction.isDNF()).toEqual(true)
    })
    test("full DNF", () => {
      expect(dnf.isConjunction()).toEqual(false)
      expect(dnf.isCNF()).toEqual(false)
      expect(dnf.isDisjunction()).toEqual(false)
      expect(dnf.isDNF()).toEqual(true)
    })
  })
  // (not x1 and x2) => x3
  const expression = new Operator("=>", new Operator("\\and", notV[0], v[1]), v[2])
  const exprTT = expression.getTruthTable()

  describe("generate CNF", () => {
    const cnf = expression.toCNF()
    const cnfTT = cnf.getTruthTable()
    test("is CNF", () => {
      expect(cnf.isCNF()).toEqual(true)
    })
    test("is equal expression", () => {
      expect(exprTT.truthTable).toEqual(cnfTT.truthTable)
    })
  })

  describe("generate DNF", () => {
    const dnf = expression.toDNF()
    const dnfTT = dnf.getTruthTable()
    test("is DNF", () => {
      expect(dnf.isDNF()).toEqual(true)
    })
    test("is equal expression", () => {
      expect(exprTT.truthTable).toEqual(dnfTT.truthTable)
    })
  })
})

describe("simplify", () => {
  for (const op of ["\\xor", "=>", "<=>"] as BinaryOperatorType[])
    test(op, () => {
      const expression = new Operator(op, v[0], v[1])
      const simplifiedExpression = expression.copy().simplify()
      const tt1 = expression.getTruthTable()
      const tt2 = simplifiedExpression.getTruthTable()
      expect(tt1.variableNames).toEqual(tt2.variableNames)
      expect(tt1.truthTable).toEqual(tt2.truthTable)
      expect(simplifiedExpression.toString()).not.toContain(op)
    })
})

describe("simplify negations", () => {
  test("no negated operators", () => {
    for (const op of ["\\and", "\\or", "\\xor", "=>", "<=>"] as BinaryOperatorType[]) {
      const expr = new Operator(
        op,
        new Operator("\\xor", v[0], v[1]),
        new Operator("<=>", v[2], notV[1]),
        true,
      )
      const exprSimplified = expr.copy().simplifyNegation()
      // contains no negated groups
      expect(exprSimplified.toString()).not.toMatch(/\\not\s*\(/)
      // is still equal to the original
      expect(exprSimplified.getTruthTable().truthTable).toEqual(expr.getTruthTable().truthTable)
    }
  })

  test("no change if not needed", () => {
    for (const op of ["\\and", "\\or", "\\xor", "=>", "<=>"] as BinaryOperatorType[]) {
      const expr = new Operator(
        op,
        new Operator("\\xor", v[0], v[1]),
        new Operator("<=>", v[2], notV[1]),
      )
      const exprSimplified = expr.copy().simplifyNegation()
      expect(exprSimplified.toString()).toEqual(expr.toString())
    }
  })
})

describe("negation", () => {
  for (const op of ["\\and", "\\or", "\\xor", "=>", "<=>"] as BinaryOperatorType[])
    test(op, () => {
      const expression = new Operator(op, v[0], v[1])
      const negatedExpression = expression.copy().negate()
      const tt1 = expression.getTruthTable()
      const tt2 = negatedExpression.getTruthTable()
      expect(tt1.variableNames).toEqual(tt2.variableNames)
      tt1.truthTable.forEach((val, index) => {
        expect(val).toEqual(!tt2.truthTable[index])
      })
    })
})

test("shuffle", () => {
  const seed = sampleRandomSeed()
  // console.log(seed)
  const random = new Random(seed)
  const expression = new Operator(
    "\\and",
    new Operator("\\or", new Operator("=>", v[0], notV[1], true), new Operator("\\xor", notV[2], v[1])),
    new Operator("\\and", new Operator("\\xor", v[1], new Operator("\\xor", v[2], v[1]), true), notV[0]),
  )

  // console.log("orig: " + expression.toString())
  for (let i = 0; i < 20; i++) {
    const shuffledExpression = expression.copy().shuffle(random)
    // console.log(i, "shuffled: " + shuffledExpression.toString())
    expect(shuffledExpression.getTruthTable()).toEqual(expression.getTruthTable())
  }
})

describe("parser", () => {
  test("errors", () => {
    for (const expr of ["(()", "(A", "\\not", "A \\and"]) {
      try {
        PropositionalLogicParser.parse(expr)
        expect(true).toBe(false)
      } catch (e) {
        expect(e).toBeInstanceOf(ParserError)
      }
    }
  })

  test("literals", () => {
    ;[
      ["A", "A"],
      ["\\not A", "\\not A"],
      ["(A)", "A"],
      ["\\not(A)", "\\not A"],
      ["(\\not A)", "\\not A"],
    ].forEach(([expr, expectedStr]) => {
      expect(PropositionalLogicParser.parse(expr).toString()).toEqual(expectedStr)
    })
  })

  test("complex", () => {
    for (const expr of [
      "\\not A \\and B",
      "\\not(A \\and B)",
      "\\not A \\and (B \\or C)",
      "(\\not A \\or B) \\and (B \\or C)",
    ]) {
      expect(PropositionalLogicParser.parse(expr).toString()).toEqual(expr)
    }
  })
})
