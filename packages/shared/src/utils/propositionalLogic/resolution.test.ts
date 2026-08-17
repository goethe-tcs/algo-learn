import { describe, expect, test } from "vitest"
import {
  generateRandomContradiction,
  generateRandomExpression,
  Literal,
} from "@shared/utils/propositionalLogic/propositionalLogic"
import { getDisjunctionTerms, literalListsEqual } from "@shared/utils/propositionalLogic/resolution"
import Random, { sampleRandomSeed } from "@shared/utils/random"

describe("Resolution", () => {
  const AT = new Literal("A")
  const BT = new Literal("B")
  const CT = new Literal("C")
  const DT = new Literal("D")
  const ET = new Literal("E")
  const FT = new Literal("F")
  const AF = new Literal("A", true)
  const BF = new Literal("B", true)
  const CF = new Literal("C", true)
  const DF = new Literal("D", true)
  const EF = new Literal("E", true)
  const FF = new Literal("F", true)

  for (let i = 0; i < 20; i++) {
    test(`Res - UNSAT - ${i}`, () => {
      const random = new Random(sampleRandomSeed())
      const contradiction = generateRandomContradiction(
        random,
        random.int(3, 6),
        random.subset(["A", "B", "C", "D", "E"], random.int(3, 5)),
      ).toCNF()
      if (contradiction) {
        const dt = contradiction.toDisjunctionTerms()
        const dtl = getDisjunctionTerms(dt, 100)
        expect(dtl.some((x) => literalListsEqual(x, []))).toBeTruthy()
      }
    })
  }

  for (let i = 0; i < 20; i++) {
    test(`Res - SAT - ${i}`, () => {
      const random = new Random(sampleRandomSeed())
      const expr = generateRandomExpression(
        random,
        random.int(3, 6),
        random.subset(["A", "B", "C", "D", "E"], random.int(3, 5)),
      ).toCNF()
      if (expr) {
        if (expr.getTruthTable().truthTable.some((x) => x)) {
          const dt = expr.toDisjunctionTerms()
          const dtl = getDisjunctionTerms(dt, 100)
          expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
        } else {
          const dt = expr.toDisjunctionTerms()
          const dtl = getDisjunctionTerms(dt, 100)
          expect(dtl.some((x) => literalListsEqual(x, []))).toBeTruthy()
        }
      }
    })
  }

  test("Res - AE - 1", () => {
    // https://ae.cs.uni-frankfurt.de/teaching/22ws/+dismod/selbsttest_01_resolution.pdf
    const dt = [[CT, DT], [ET, DF, CF, AF], [AF, BF], [BF], [CT]]
    const dtl = getDisjunctionTerms(dt, 2)
    expect(dtl.some((x) => literalListsEqual(x, [DT]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, BT, CF, ET]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [DT, AF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [CF, CT, ET, AF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [BT, ET]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, ET, BF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [ET, AF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [DF, DT, ET, AF]))).toBeTruthy()
  })

  test("Res - AE - 2", () => {
    // https://ae.cs.uni-frankfurt.de/teaching/22ws/+dismod/selbsttest_01_resolution.pdf
    const dt = [[BT], [AT, DF, CF, BF], [CT, AF], [BT, EF], [CT, DF, ET, AF], [ET]]
    const dtl = getDisjunctionTerms(dt, 2)
    expect(dtl.some((x) => literalListsEqual(x, [DT]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, DF, AF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, EF, DF, CF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, BF, DF, CF, AF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [BT, ET, BF, DF, AF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [ET, EF, DF, CF, BF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, EF, DT, CF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [CF, BT, DT, ET]))).toBeFalsy()
  })

  test("Res - AE - 3", () => {
    // https://ae.cs.uni-frankfurt.de/teaching/22ws/+dismod/selbsttest_02_resolution.pdf
    const dt = [[AT, BF], [DF], [CT], [DF, BF, AF], [AT, CT, DT, BF], [ET]]
    const dtl = getDisjunctionTerms(dt, 2)
    expect(dtl.some((x) => literalListsEqual(x, [DF, BF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, CT, BF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [BT, DT]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [DT]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [CF, AF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [EF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [CF, DF, ET, AF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, DT]))).toBeFalsy()
  })

  test("Res - AE - 4", () => {
    // https://ae.cs.uni-frankfurt.de/teaching/22ws/+dismod/selbsttest_02_resolution.pdf
    const dt = [[AT, DT], [AT, DT, BF], [AT, CT, DT, ET], [CF], [BT, CT, DF, AF], [EF, DT, CF, BF]]
    const dtl = getDisjunctionTerms(dt, 2)
    expect(dtl.some((x) => literalListsEqual(x, [BT, DT, DF, ET]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [CT, DT, EF, DF, CF, AF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, BT, ET, BF, EF, AF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, EF, BF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, CT, ET, AF, EF, BF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [BT, CT, EF, CF, AF]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, BT, CT, DT, BF, CF, AF]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, CT, DT, ET, EF, AF]))).toBeTruthy()
  })

  test("Res - No Invalid resolution step - 1", () => {
    const dt = [[AT, BT, CT], [BT, CT], [BF, AT], [BT, AF], [AT]]
    const dtl = getDisjunctionTerms(dt)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
  })

  test("Res - No Invalid resolution step - 2", () => {
    const dt = [[AT, CF], [CT, AF, BF], [BF], [BT, AF, AF]]
    const dtl = getDisjunctionTerms(dt)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
  })

  test("Res - Multiple complementary - 1", () => {
    const dt = [
      [AT, BT, CF],
      [AF, CT, DT],
    ]
    const dtl = getDisjunctionTerms(dt, 1)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [BT, DT]))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [BT, CF, CT, DT]))).toBeTruthy()
  })

  test("Res - Multiple complementary - 2", () => {
    const dt = [[AT, AF], [AT]]
    const dtl = getDisjunctionTerms(dt, 1)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AT]))).toBeTruthy()
  })

  test("Res - Multiple complementary - 3", () => {
    const dt = [[AF], [AT]]
    const dtl = getDisjunctionTerms(dt, 1)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [AT, AF]))).toBeFalsy()
  })

  test("Res - Multiple complementary - 4", () => {
    const dt = [[AF, BF, BT], [BT]]
    const dtl = getDisjunctionTerms(dt, 1)
    expect(dtl.some((x) => literalListsEqual(x, [AF, BT]))).toBeTruthy()
  })

  test("Res - Double complementary - 1", () => {
    const dt = [
      [AF, BF],
      [AT, BT],
    ]
    const dtl = getDisjunctionTerms(dt, 1)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [AF, AT]))).toBeTruthy()
    expect(dtl.some((x) => literalListsEqual(x, [BF, BT]))).toBeTruthy()
  })

  test("Res - Tautology after resolution", () => {
    const dt = [[AF, BF, BT], [AT]]
    const dtl = getDisjunctionTerms(dt, 1)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeFalsy()
    expect(dtl.some((x) => literalListsEqual(x, [BF, BT]))).toBeTruthy()
  })

  test("Res - PHP 3 2", () => {
    const dt = [
      [AT, BT],
      [CT, DT],
      [ET, FT],
      [AF, CF],
      [AF, EF],
      [CF, EF],
      [BF, DF],
      [BF, FF],
      [DF, FF],
    ]
    const dtl = getDisjunctionTerms(dt)
    expect(dtl.some((x) => literalListsEqual(x, []))).toBeTruthy()
  })
})
