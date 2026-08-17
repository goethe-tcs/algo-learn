import { allParameterCombinations } from "packages/shared/src/api/Parameters"
import { describe, expect, test } from "vitest"
import { collection } from "./questionsSelection.ts"

const allowedSlugsExplanation = "only lower case letters or '-'"
const allowedSlugs = /^[a-z-]+$/

describe(`slugs of collection`, () => {
  const slugs = new Set<string>()
  for (const { slug } of collection) {
    test(`slug ${slug} contains ${allowedSlugsExplanation}`, () => {
      expect(slug).toMatch(allowedSlugs)
    })
    test(`slug ${slug} is unique`, () => {
      expect(slugs.has(slug)).toBe(false)
      slugs.add(slug)
    })
  }
})

const generators = collection.flatMap((x) => x.contents)

describe(`IDs of question generators`, () => {
  const ids = new Set<string>()
  for (const generator of generators) {
    test(`id ${generator.id} contains ${allowedSlugsExplanation}`, () => {
      expect(generator.id).toMatch(allowedSlugs)
    })
    test(`id ${generator.id} has length at most 10`, () => {
      expect(generator.id.length).toBeLessThanOrEqual(10)
    })
    test(`id ${generator.id} is unique`, () => {
      expect(ids.has(generator.id)).toBe(false)
      ids.add(generator.id)
    })
  }
})
for (const generator of generators) {
  describe(`Sanity-checks for question generator "${generator.id}"`, () => {
    test("Meta-data is present", () => {
      expect(generator.expectedParameters.length).toBeGreaterThanOrEqual(0)
      expect(generator.languages.length).toBeGreaterThan(0)
      for (const lang of generator.languages) {
        expect(generator.name(lang)).not.toBe("name")
      }
    })
    test("At least one valid value for each expected parameter", () => {
      for (const p of generator.expectedParameters) {
        if (p.type === "integer") {
          expect(p.min).toBeLessThanOrEqual(p.max)
        } else if (p.type === "string") {
          expect(p.allowedValues.length).toBeGreaterThan(0)
        }
      }
    })

    const allCombinations = allParameterCombinations(generator.expectedParameters)
    test(`Test that generator has at least one allowed input`, () => {
      expect(allCombinations.length).toBeGreaterThan(0)
    })
    for (const lang of generator.languages) {
      for (const parameters of allCombinations) {
        test(`Generate with language ${lang} and parameters ${JSON.stringify(parameters)}`, () => {
          const ret = generator.generate(lang, parameters, "myFancySeed")
          expect(!(ret instanceof Promise)).toBe(true)
          if (ret instanceof Promise) return
          const { question } = ret
          expect(question.name).not.toBe("")
          expect(question.path).not.toBe("")
          expect(question.type).toMatch(
            /^(MultipleChoiceQuestion|FreeTextQuestion|MultiFreeTextQuestion|MatchingQuestion)$/,
          )
          expect(question.text).toBeDefined()
          expect(question.text).not.toBe("")
          expect(question.feedback).toBeDefined()
          if (question.type === "MultipleChoiceQuestion") {
            expect(() => question.feedback!({ choice: [0] })).not.toThrow()
          } else if (question.type === "MatchingQuestion") {
            expect(() => question.feedback!({ choice: [0] })).not.toThrow()
          } else if (question.type === "FreeTextQuestion") {
            const f = question.feedback!({ text: "some random wrong answer" })
            expect(!(f instanceof Promise)).toBe(true)
            if (f instanceof Promise) return
            expect(f.correct).toBe(false)
          }
        })
      }
    }
  })
}
