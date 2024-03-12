import Fraction from "fraction.js"
import { MathNode } from "mathjs"
import {
  FreeTextFeedbackFunction,
  FreeTextFormatFunction,
  FreeTextQuestion,
  minimalMultipleChoiceFeedback,
  Question,
  QuestionGenerator,
} from "../../api/QuestionGenerator"
import { serializeGeneratorCall } from "../../api/QuestionRouter"
import { format } from "../../utils/format"
import math, { getVars } from "../../utils/math"
import Random from "../../utils/random"
import { tFunction, tFunctional, Translations } from "../../utils/translations"
import { mathNodeToSumProductTerm, SumProductTerm } from "../asymptotics/asymptoticsUtils"
import { sampleMasterRecursion, sampleMasterRecursionAnswers } from "./formulaUtils"

const translations: Translations = {
  en: {
    code: "\\[{{0}}\\]",
    text1:
      "Let $ {{0}}(n) $ for positive integers $n$ be defined via the following recurrence relations:\\[{{1}}\\] \\[{{2}}\\,.\\]",
    text2: `Use the master theorem to find a closed form of $ {{0}} $ in $\\Theta$-notation.`,
    name: "Master Theorem",
    description: "Find the closed form of a recurrence relation",
    bottomnote: "Note: You can assume that $n = {{0}}$ for a $k \\in \\mathbb{N}$ with $k>0$",
    "feedback.incomplete": "Incomplete or too complex",
    "feedback.unknown-variable": "Unknown variable",
    "feedback.expected": "Expected",
    "feedback.invalid-expression": "invalid formula",
    "feedback.wrong.case1":
      "We are in case 1, because $f(n) = \\Oh\\left(n^log_{b}(a) - \\espilon\\right)$",
  },
  de: {
    code: "\\[{{0}}\\]",
    text1:
      "Sei $ {{0}}(n) $ für positive ganze Zahlen $n$ definiert durch die folgende Rekursionsgleichung:\\[{{1}}\\] \\[{{2}}\\,.\\]",
    text2: `Verwende das Mastertheorem, um für $ {{0}} $ eine geschlossene Form in $\\Theta$-Notation zu erhalten.`,
    name: "Mastertheorem",
    description: "Finde die geschlossene Form für eine Rekursionsgleichung",
    bottomnote:
      "Hinweis: Du kannst davon ausgehen, dass $n = {{0}}$ gilt für ein $k\\in \\mathbb{N}$ mit $k>0$",
    "feedback.incomplete": "Unvollständig oder zu komplex",
    "feedback.unknown-variable": "Unbekannte Variable",
    "feedback.expected": "Erwartet",
    "feedback.invalid-expression": "ungültige Formel",
    "feedback.wrong.case1":
      "Wir sind in Fall 1, da $f(n) = \\Oh\\left(n^log_{b}(a) - \\espilon\\right)$",
  },
}

export const RecurrenceMaster: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      type: "string",
      name: "variant",
      allowedValues: ["choice", "input"],
    },
  ],
  generate(generatorPath, lang, parameters, seed) {
    const permalink = serializeGeneratorCall({
      generator: RecurrenceMaster,
      lang,
      parameters,
      seed,
      generatorPath,
    })
    const random = new Random(seed)
    const { t } = tFunction(translations, lang)

    const variant = parameters.variant as "choice" | "input"
    const { b, a, d, c, solution, masterCase } = sampleMasterRecursion(random)

    const T = random.choice("TABCDEFGHS".split(""))
    const answers = sampleMasterRecursionAnswers({
      random,
      masterCase,
      a,
      b,
      c,
    })
    const text = `
    ${format(t("text1"), [
      T,
      `${T}(n) = ${a === 1 ? "" : a} ${T}(n/${b}) + ${c.toLatex("n")}`,
      `${T}(1) = ${d}`,
    ])}

    ${format(t("text2"), [`${T}(n)`])}`
    let question: Question
    if (variant === "choice") {
      question = {
        type: "MultipleChoiceQuestion",
        name: t("name"),
        path: permalink,
        text: text,
        answers: answers.map(({ element }) => `${format(t("code"), [element])}`),
        feedback: minimalMultipleChoiceFeedback({
          correctAnswerIndex: answers
            .map((x, i) => ({ ...x, i }))
            .filter((x) => x.correct)
            .map((x) => x.i),
        }),
      }
    } else {
      const prompt = `$\\Theta$ `
      const bottomText = t("bottomnote", [`${b}^k`])
      const checkFormat: FreeTextFormatFunction = ({ text }) => {
        if (text.trim() === "") return { valid: false }
        let mathNode: MathNode
        try {
          mathNode = math.parse(text)
          const unknownVars = getVars(mathNode).filter((v) => v !== "n")
          const unknownVar: string | null = unknownVars.length > 0 ? unknownVars[0] : null
          if (unknownVar) {
            return {
              valid: false,
              message: `${t("feedback.unknown-variable")}: $${unknownVar}$. ${t(
                "feedback.expected",
              )}: $${"n"}$.`,
            }
          }
          try {
            mathNodeToSumProductTerm(math.parse(text))
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
          } catch (e) {
            return {
              valid: false,
              message: t("feedback.incomplete"),
            }
          }
        } catch (e) {
          return {
            valid: false,
            message: t("feedback.invalid-expression"),
          }
        }
      }

      const feedback: FreeTextFeedbackFunction = ({ text }) => {
        solution.coefficient = new Fraction(1)
        const correctAnswer = "$\\Theta(" + solution.toLatex("n") + ")$"
        const sumProductTerm: SumProductTerm = mathNodeToSumProductTerm(math.parse(text))

        return {
          correct: solution.Theta(sumProductTerm.dominantTerm()),
          correctAnswer,
        }
      }
      question = {
        type: "FreeTextQuestion",
        path: permalink,
        name: t("name"),
        text,
        prompt,
        bottomText,
        placeholder: "n^2 * log(n)",
        feedback,
        checkFormat,
      } as FreeTextQuestion
    }
    return { question }
  },
}
