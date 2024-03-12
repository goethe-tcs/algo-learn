import { MathNode } from "mathjs"
import {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  FreeTextQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator"
import { serializeGeneratorCall } from "../../api/QuestionRouter"
import math, { getVars } from "../../utils/math"
import Random from "../../utils/random"
import { tFunction, tFunctional, Translations } from "../../utils/translations"
import {
  createProductTerm,
  IteratedLogarithms,
  mathNodeToSumProductTerm,
  ProductTerm,
  sampleFraction,
  SumProductTerm,
} from "./asymptoticsUtils"

const translation: Translations = {
  en: {
    "Theta.text": "Enter a function ${{0}}$ that satisfies ${{1}}$.",
    note: "Note: This text field accepts *simple* mathematical formulas, such as `{{0}}`, `{{1}}`, or `{{2}}`.",
    text: "Enter a function ${{0}}$ that satisfies \\[{{1}}\\] and \\[{{2}}\\,.\\]",
    name: "Between",
    description: "Find a function satisfying asymptotic conditions",
    "feedback.unknown-variable": "Unknown variable",
    "feedback.expected": "Expected",
    "feedback.invalid-expression": "invalid formula",
    "feedback.incomplete": "Incomplete or too complex",
  },
  de: {
    "Theta.text": "Gib eine Funktion ${{0}}$ an, die ${{1}}$ erfüllt.",
    note: "Hinweis: Dieses Feld erwartet *einfache* mathematische Formeln, wie etwa `{{0}}`, `{{1}}`, oder `{{2}}`.",
    text: "Gib eine Funktion ${{0}}$ an, die \\[{{1}}\\] und \\[{{2}}\\] erfüllt.",
    description: "Finde eine Funktion, die asymptotische Bedingungen erfüllt",
    name: "Dazwischen",
    "feedback.unknown-variable": "Unbekannte Variable",
    "feedback.expected": "Erwartet",
    "feedback.invalid-expression": "ungültige Formel",
    "feedback.incomplete": "Nicht vollständig oder zu komplex",
  },
}

/** Generate and render a question about O/Omega/o/omega */
export const Between: QuestionGenerator = {
  name: tFunctional(translation, "name"),
  description: tFunctional(translation, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["start", "log", "loglog", "nifty"],
    },
  ],
  generate: (generatorPath, lang, parameters, seed) => {
    const { t } = tFunction(translation, lang)
    const variant = parameters.variant as "start" | "log" | "loglog" | "nifty"

    const random = new Random(seed)
    const functionName = random.choice("fghFGHT".split(""))
    const variable = random.choice("nmNMxyztk".split(""))
    const [a, b] = generateBaseFunction(variant, random)

    let aLandau, bLandau
    if (a.compare(b) < 0) {
      aLandau = "\\omega"
      bLandau = "o"
    } else {
      aLandau = "o"
      bLandau = "\\omega"
    }

    let text: string
    const functionDeclaration = `${functionName}\\colon\\mathbb N\\to\\mathbb R`
    if (variant === "nifty") {
      const condTheta = `${functionName}(${variable}) \\in ${`${"\\Theta"}(${functionName}(${variable})^2)`}`
      text = t("Theta.text", [functionDeclaration, condTheta])
    } else {
      const aTeX = `${aLandau}(${a.toLatex(variable)})`
      const bTeX = `${bLandau}(${b.toLatex(variable)})`
      const condA = `${functionName}(${variable}) \\in ${aTeX}`
      const condB = `${functionName}(${variable}) \\in ${bTeX}`
      text = t("text", [functionDeclaration, condA, condB])
    }

    const prompt = `$${functionName}(${variable}) =$ `

    const bottomText: string = t("note", ["96n^3", "n * log(n)", "n^(2/3)"])

    const checkFormat: FreeTextFormatFunction = ({ text }) => {
      if (text.trim() === "") {
        return {
          valid: false,
        }
      }
      let mathNode: MathNode | undefined
      let valid = true
      try {
        mathNode = math.parse(text)
      } catch (e) {
        valid = false
      }
      if (
        !valid ||
        mathNode === undefined ||
        (mathNode instanceof math.ConstantNode && mathNode.value === undefined)
      ) {
        return {
          valid: false,
          message: t("feedback.invalid-expression"),
        }
      }

      const unknownVars = getVars(mathNode).filter((v) => v !== variable)
      const unknownVar: string | null = unknownVars.length > 0 ? unknownVars[0] : null
      if (unknownVar) {
        return {
          valid: false,
          message: `${t("feedback.unknown-variable")}: $${unknownVar}$.

${t("feedback.expected")}: $${variable}$.`,
        }
      }

      return {
        valid: true,
        message:
          "$" +
          mathNode.toTex({
            parenthesis: "auto",
            implicit: "show",
          }) +
          "$",
      }
    }

    const feedback: FreeTextFeedbackFunction = ({ text }) => {
      let mathNode: MathNode
      try {
        mathNode = math.parse(text)
      } catch (e) {
        return {
          correct: false,
          message: t("feedback.invalid-expression"),
        }
      }

      const unknownVars = getVars(mathNode).filter((v) => v !== variable)
      const unknownVar: string | null = unknownVars.length > 0 ? unknownVars[0] : null
      if (unknownVar) {
        return {
          correct: false,
          feedbackText: `${t(
            "feedback.unknown-variable",
          )}: $${unknownVar}$. ${t("feedback.expected")}: $${variable}$.`,
        }
      }

      let sumProductTerm: SumProductTerm
      try {
        sumProductTerm = mathNodeToSumProductTerm(math.parse(text))
      } catch (e) {
        return {
          correct: false,
          feedbackText: t("feedback.incomplete"),
        }
      }

      if (variant === "nifty") {
        return {
          correct:
            sumProductTerm.getTerms()[0].exponentialBase.n === 1 &&
            sumProductTerm.getTerms()[0].exponentialBase.d === 1 &&
            sumProductTerm.getTerms()[0].logarithmExponents.size === 0,
          feedbackText:
            "$" +
            mathNode.toTex({
              parenthesis: "auto",
              implicit: "show",
            }) +
            "$",
        }
      } else {
        return {
          correct: sumProductTerm.compare(a) * sumProductTerm.compare(b) < 0,
          feedbackText:
            "$" +
            mathNode.toTex({
              parenthesis: "auto",
              implicit: "show",
            }) +
            "$",
        }
      }
    }

    const question: FreeTextQuestion = {
      type: "FreeTextQuestion",
      name: t("name"),
      path: serializeGeneratorCall({
        generator: Between,
        lang,
        parameters,
        seed,
        generatorPath,
      }),
      text,
      prompt,
      placeholder: "mathematical formula",
      bottomText,
      feedback,
      checkFormat,
    }

    return { question }
  },
}

export function generateBaseFunction(variant: string, random: Random): ProductTerm[] {
  switch (variant) {
    default: {
      return [new ProductTerm(), new ProductTerm()]
    }
    case "start": {
      const a = createProductTerm({
        coefficient: sampleFraction({ fractionProbability: 1 / 3, random }),
        polyexponent: sampleFraction({ fractionProbability: 0, random }),
      })
      const b = createProductTerm({
        coefficient: sampleFraction({ fractionProbability: 1 / 3, random }),
        polyexponent: sampleFraction({ fractionProbability: 0, random }),
      })
      do {
        b.logarithmExponents.get(0).n = random.int(
          a.logarithmExponents.get(0).n - 2,
          a.logarithmExponents.get(0).n + 2,
        )
      } while (b.logarithmExponents.get(0).n === a.logarithmExponents.get(0).n)
      return [a, b]
    }
    case "log": {
      const a = createProductTerm({
        coefficient: sampleFraction({
          fractionProbability: 1 / 3,
          random,
        }),
        polyexponent: sampleFraction({
          fractionProbability: 1 / 3,
          maxInt: 3,
          maxDenominator: 3,
          random,
        }),
        logexponent: sampleFraction({
          fractionProbability: 0,
          minInt: -17,
          maxInt: 17,
          random,
        }),
      })
      const b = createProductTerm({
        coefficient: sampleFraction({
          fractionProbability: 1 / 3,
          random,
        }),
        polyexponent: sampleFraction({
          fractionProbability: 1 / 3,
          maxInt: 3,
          maxDenominator: 3,
          random,
        }),
        logexponent: sampleFraction({
          fractionProbability: 0,
          minInt: -17,
          maxInt: 17,
          random,
        }),
      })
      a.logarithmExponents.get(1).n = 0
      b.logarithmExponents.get(0).n = a.logarithmExponents.get(0).n
      b.logarithmExponents.get(0).d = a.logarithmExponents.get(0).d
      return random.shuffle([a, b])
    }

    case "loglog": {
      const exponents = new IteratedLogarithms()
      exponents.set(
        2,
        sampleFraction({
          fractionProbability: 0,
          minInt: 2,
          maxInt: 7,
          random,
        }),
      )

      const a = new ProductTerm({
        coefficient: sampleFraction({
          fractionProbability: 1 / 3,
          minInt: 1,
          maxInt: 7,
          random,
        }),
        logarithmExponents: exponents,
      })
      const b = createProductTerm({
        coefficient: sampleFraction({
          fractionProbability: 1 / 3,
          random,
        }),
        logexponent: sampleFraction({
          fractionProbability: 1,
          random,
        }),
      })
      return random.shuffle([a, b])
    }
  }
}
