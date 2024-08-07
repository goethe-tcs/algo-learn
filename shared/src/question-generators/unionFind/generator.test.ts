/**
 * Tests for all the union generators
 */
import { describe, expect, test } from "vitest"
import { FreeTextQuestion } from "@shared/api/QuestionGenerator"
import { QuickFindGenerator } from "@shared/question-generators/unionFind/quickFind/generatorQF"
import { QuickFind } from "@shared/question-generators/unionFind/quickFind/quickFindAlgorithm"
import { sampleRandomSeed } from "@shared/utils/random"

interface TestingObjectGeneratorQuickFind {
  question: FreeTextQuestion
  testing: {
    union: QuickFind
    gapField: string
    gapOperationValues: number[]
  }
}

describe("QuickFindGenerator - Correctness", () => {
  for (let i = 0; i <= 10; i++) {
    test(`${i}. random quick find question`, () => {
      const { question: q, testing: t } = QuickFindGenerator.generate(
        "en", // language not relevant
        { variant: "start" }, // generator only supports one variant
        sampleRandomSeed(),
      ) as TestingObjectGeneratorQuickFind

      expect(q.type).toEqual("FreeTextQuestion")
      expect(q.feedback).toBeDefined
      if (q.feedback !== undefined) {
        expect(q.feedback({ text: "1" })).toBeFalsy
        expect(q.feedback({ text: t.union.getArray().toString() })).toBeTruthy
      }

      // gapField and gapOperationValues are not empty
      expect(t.gapField).not.toEqual("")
      // gapOperationValues are between 0 and 14
      expect(t.gapOperationValues[0]).toBeGreaterThanOrEqual(0)
      expect(t.gapOperationValues[1]).toBeGreaterThanOrEqual(0)
      expect(t.gapOperationValues[0]).toBeLessThanOrEqual(14)
      expect(t.gapOperationValues[1]).toBeLessThanOrEqual(14)
    })
  }
})

describe("QuickFindGenerator - Reproducible", () => {
  const seed = sampleRandomSeed()
  // generate question the first time
  const { question: q1, testing: t1 } = QuickFindGenerator.generate(
    "en", // language not relevant
    { variant: "start" }, // generator only supports one variant
    seed, // the random seed
  ) as TestingObjectGeneratorQuickFind

  // generate question a second time with the same seed (just different language)
  const { question: q2, testing: t2 } = QuickFindGenerator.generate(
    "de", // language not relevant
    { variant: "start" }, // generator does not support parameters
    seed, // the random seed
  ) as TestingObjectGeneratorQuickFind

  test("different languages, same question", () => {
    expect(q1.type).toEqual(q2.type)
    expect(t1.gapOperationValues).toEqual(t2.gapOperationValues)
  })
})
