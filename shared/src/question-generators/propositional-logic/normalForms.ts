import { Language } from "../../api/Language.ts"
import {
  FreeTextFeedbackFunction,
  FreeTextQuestion,
  minimalMultipleChoiceFeedback,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../api/QuestionRouter.ts"
import {
  ExpressionProperties,
  generateRandomExpression,
  PropositionalLogicParser,
  SyntaxTreeNodeType,
} from "../../utils/propositionalLogic.ts"
import Random from "../../utils/random.ts"
import { t, tFunctional, Translations } from "../../utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Normal Forms",
    description: "Find the right normal form of a given propositional logic expression.",
    param_size: "The number of variables used",
    choice_question:
      "Let the following propositional logic expression be given: \\[{{0}}\\] Select the {{1}} of the expression?",
    freetext_question:
      "Let the following propositional logic expression be given: \\[{{0}}\\] Enter an equivalent {{1}}.",
    freetext_prompt: "Normal Form:",
    freetext_bottom_text: "Use the following buttons for easier input",
    freetext_feedback_not_equivalent: "Your answer is not equivalent to the given expression.",
    freetext_feedback_unknown_variables:
      "Your answer contains variables not used in the given expression.",
    freetext_feedback_no_normal_form: "Your answer is not a {{0}}.",
    freetext_feedback_parse_error: "Your answer couldn't be parsed.",
    dnf: "disjunctive normal form (DNF)",
    cnf: "conjunctive normal form (CNF)",
  },
  de: {
    name: "Normalformen",
    description: "Finde die richtige Normalform zu einer gegebenen aussagenlogischen Formel.",
    param_size: "Die Anzahl der verwendeten Variablen",
    choice_question:
      "Betrachten Sie den folgenden aussagenlogischen Ausdruck \\[{{0}}\\] Welche der folgenden Aussagen treffen auf den Ausdruck zu?",
    freetext_question:
      "Betrachten Sie den folgenden aussagenlogischen Ausdruck \\[{{0}}\\] Geben Sie eine äquivalente {{1}} an.",
    freetext_prompt: "Normalform:",
    freetext_bottom_text: "Verwenden sie die folgenden Buttons als Eingabehilfe.",
    freetext_feedback_not_equivalent: "Ihre Antwort ist nicht äquivalent zum gegebenen Ausdruck.",
    freetext_feedback_unknown_variables:
      "Ihre Antwort verwendet andere Variablen als der gegebene Ausdruck.",
    freetext_feedback_no_normal_form: "Ihre Antwort ist keine {{0}}.",
    freetext_feedback_parse_error: "Ihre Antwort ist kein gültiger aussagenlogischer Ausdruck.",
    dnf: "disjunktive Normalform (DNF)",
    cnf: "konjunktive Normalform (KNF)",
  },
}

const variableNames = [
  ["x_1", "x_2", "x_3"],
  ["A", "B", "C"],
  ["u", "v", "w"],
]

export const NormalForms: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["boolean logic", "propositional logic", "propositional calculus", "normal forms", "CNF", "DNF"],
  languages: ["en", "de"],
  author: "Alex Schickedanz",
  license: "MIT",
  expectedParameters: [
    {
      name: "variant",
      type: "string",
      allowedValues: ["choice", "input"],
    },
    {
      name: "size",
      description: tFunctional(translations, "param_size"),
      type: "integer",
      min: 2,
      max: 3,
    },
  ],

  /**
   * Generates a new MultipleChoiceQuestion question.
   *
   * @param generatorPath The path the generator is located on the page. Defined in settings/questionSelection.ts
   * @param lang The language of the question
   * @param parameters The parameters for the question.
   * @param seed The seed for the random number generator
   * @returns A new MultipleChoiceQuestion question
   */
  generate: (generatorPath, lang = "en", parameters, seed) => {
    const path = serializeGeneratorCall({
      generator: NormalForms,
      lang,
      parameters,
      seed,
      generatorPath,
    })

    // initialize the RNG so the question can be generated again
    const random = new Random(seed)

    const varNames = random.choice(variableNames).slice(0, <number>parameters.size)
    const numLeaves = (<number>parameters.size ?? 2) * 3

    let expression: SyntaxTreeNodeType
    let satisfiabilityProperties: ExpressionProperties

    do {
      expression = generateRandomExpression(random, numLeaves, varNames)
      satisfiabilityProperties = expression.getProperties()
    } while (!satisfiabilityProperties.satisfiable || !satisfiabilityProperties.falsifiable)

    const dnf = random.bool()
    const normalForm = dnf ? expression.toDNF() : expression.toCNF()

    const question =
      parameters["variant"] === undefined || <string>parameters["variant"] === "choice"
        ? makeMultipleChoiceQuestion(lang, path, random, expression, dnf)
        : makeFreeTextQuestion(lang, path, expression, dnf)

    return {
      question,
      // allows for unit tests
      testing: {
        expression,
        normalForm,
      },
    }
  },
}

function makeMultipleChoiceQuestion(
  lang: Language,
  path: string,
  random: Random,
  expression: SyntaxTreeNodeType,
  isDNF: boolean,
): MultipleChoiceQuestion {
  const correctNormalForm = isDNF ? expression.toDNF() : expression.toCNF()
  const correctAnswerTruthTable = correctNormalForm.getTruthTable().truthTable
  const correctAnswerStr = correctNormalForm.toString(true)

  const answers: string[] = []

  let newWrongAnswer: SyntaxTreeNodeType
  let newWrongAnswerStr: string

  const wrongAnswerStrategies: (() => SyntaxTreeNodeType)[] = [
    () => {
      return correctNormalForm.copy().invertRandomLiterals(random, random.int(2, 4))
    },
    () => {
      const tmpExpr = expression.copy().invertRandomLiterals(random, 1)
      return isDNF ? tmpExpr.toDNF() : tmpExpr.toCNF()
    },
    () => {
      const tmpExpr = expression.copy().invertRandomLiterals(random, 1)
      return random.bool() ? tmpExpr.toDNF() : tmpExpr.toCNF()
    },
  ]

  const wrongAnswersStrategy = random.choice(wrongAnswerStrategies)
  while (answers.length < 3) {
    newWrongAnswer = wrongAnswersStrategy()
    newWrongAnswerStr = newWrongAnswer.toString(true)
    if (
      correctAnswerTruthTable != newWrongAnswer.getTruthTable().truthTable &&
      answers.every((answerStr) => answerStr !== newWrongAnswerStr)
    )
      answers.push(newWrongAnswerStr)
  }

  answers.push(correctAnswerStr)
  random.shuffle(answers)

  const correctAnswerIndex = answers.indexOf(correctAnswerStr)

  return <MultipleChoiceQuestion>{
    type: "MultipleChoiceQuestion",
    name: NormalForms.name(lang),
    path: path,
    text: t(translations, lang, "choice_question", [
      expression.toString(true),
      t(translations, lang, isDNF ? "dnf" : "cnf"),
    ]),
    answers: answers.map((str) => `$${str}$`),
    allowMultiple: true,
    feedback: minimalMultipleChoiceFeedback({
      correctAnswerIndex,
      // todo add feedback depending on selection? how?
      // feedbackText: getAdditionalFeedbackText(satisfiable, falsifiable, lang),
    }),
  }
}

function getCorrectNormalFormStr(expression: SyntaxTreeNodeType, isDNF: boolean): string {
  return "$" + (isDNF ? expression.toDNF() : expression.toCNF()).toString(true) + "$"
}

function getFreeTextFeedbackFunction(
  lang: Language,
  expression: SyntaxTreeNodeType,
  isDNF: boolean,
): FreeTextFeedbackFunction {
  return ({ text }) => {
    try {
      const answer = PropositionalLogicParser.parse(text)
      if (isDNF ? answer.isDNF() : answer.isCNF)
        return {
          correct: false,
          correctAnswer: "$" + getCorrectNormalFormStr(expression, isDNF) + "$",
          feedbackText: t(translations, lang, "freetext_feedback_no_normal_form"),
        }

      const { variableNames: exprVars, truthTable: exprTruthTable } = expression.getTruthTable()
      const { variableNames: answerVars, truthTable: answerTruthTable } = answer.getTruthTable()

      if (exprVars !== answerVars)
        return {
          correct: false,
          correctAnswer: getCorrectNormalFormStr(expression, isDNF),
          feedbackText: t(translations, lang, "freetext_feedback_unknown_variables"),
        }

      if (exprTruthTable !== answerTruthTable)
        return {
          correct: false,
          correctAnswer: getCorrectNormalFormStr(expression, isDNF),
          feedbackText: t(translations, lang, "freetext_feedback_not_equivalent"),
        }

      return {
        correct: true,
      }
    } catch (e) {
      return {
        correct: false,
        correctAnswer: getCorrectNormalFormStr(expression, isDNF),
        feedbackText: t(translations, lang, "freetext_feedback_parse_error"),
      }
    }
  }
}

function makeFreeTextQuestion(
  lang: Language,
  path: string,
  expression: SyntaxTreeNodeType,
  isDNF: boolean,
): FreeTextQuestion {
  return <FreeTextQuestion>{
    type: "FreeTextQuestion",
    name: NormalForms.name(lang),
    path: path,
    text: t(translations, lang, "freetext_question", [
      expression.toString(true),
      t(translations, lang, isDNF ? "dnf" : "cnf"),
    ]),
    prompt: t(translations, lang, "freetext_prompt"),
    // placeholder: t(translations, lang, "freetext_placeholder"),
    bottomText: t(translations, lang, "freetext_bottom_text"),
    feedback: getFreeTextFeedbackFunction(lang, expression, isDNF),
    // checkFormat:,
    typingAid: [
      { text: "$($", input: "(" },
      { text: "$)$", input: ")" },
      { text: "$\\vee$", input: "\\or" },
      { text: "$\\wedge$", input: "\\and" },
      { text: "$\\neg$", input: "\\not" },
    ].concat(
      expression.getVariableNames().map((v) => {
        return { text: `$${v}$`, input: v }
      }),
    ),
  }
}
