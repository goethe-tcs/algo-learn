import { Language } from "../../api/Language.ts"
import {
  minimalMultipleChoiceFeedback,
  MultipleChoiceQuestion,
  QuestionGenerator,
} from "../../api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "../../api/QuestionRouter.ts"
import {
  generateRandomContradiction,
  generateRandomExpression,
  generateRandomTautology,
  VariableValues,
} from "../../utils/propositionalLogic.ts"
import Random from "../../utils/random.ts"
import { t, tFunctional, Translations } from "../../utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Satisfiability Properties",
    description: "Choose the right satisfiability properties of a given expression.",
    size: "The size of the generated expression",
    text: "Let the following propositional logic expression be given: \\[{{0}}\\] Which of the following statements apply to this expression?",
    answer_tautology: "The expression is a **tautology**",
    answer_verifiable: "The expression is **verifiable**",
    answer_falsifiable: "The expression is **falsifiable**",
    answer_contradiction: "The expression is  a **contradiction**",
    feedback_contradiction: "The expression evaluates to false for all variable assignments.",
    feedback_tautology: "The expression evaluates to true for all variable assignments.",
    feedback_examples:
      "The expression can be **falsified** by \\[{{0}}\\] and **verified** by \\[{{1}}\\]",
  },
  de: {
    name: "Erfüllbarkeitseigenschaften",
    description:
      "Wähle die richtigen Erfüllbarkeitseigenschaften eines aussagenlogischen Ausdrucks aus.",
    size: "Die Größe des erzeugten Ausdrucks.",
    text: "Betrachten Sie den folgenden aussagenlogischen Ausdruck \\[{{0}}\\] Welche der folgenden Aussagen treffen auf den Ausdruck zu?",
    answer_tautology: "Die Aussage is eine **Tautologie**",
    answer_verifiable: "Die Aussage is **erfüllbar**",
    answer_falsifiable: "Die Aussage is **falsifizierbar**",
    answer_contradiction: "Die Aussage is ein **Widerspruch**",
    feedback_contradiction: "Die Aussage ist für alle Variablenbelegungen falsifiziert",
    feedback_tautology: "Die Aussage ist für alle Variablenbelegungen erfüllt",
    feedback_examples:
      "Die Aussage wird **falsifiziert** durch \\[{{0}}\\] und **erfüllt** durch \\[{{1}}\\]",
  },
}

const variableNames = [
  ["x_1", "x_2", "x_3", "x_4", "x_5", "x_6"],
  ["A", "B", "C", "D", "E", "F"],
  ["u", "v", "w", "x", "y", "z"],
]

function getAdditionalFeedbackText(
  satisfiable: false | VariableValues,
  falsifiable: false | VariableValues,
  lang: Language,
): string {
  if (satisfiable === false) return t(translations, lang, "feedback_contradiction")
  if (falsifiable === false) return t(translations, lang, "feedback_tautology")

  const falsifiedBy = Object.keys(satisfiable)
    .map((variable) => `${variable} = ${satisfiable[variable] ? "\\mathtt{true}" : "\\mathtt{false}"}`)
    .join(", ")
  const verifiedBy = Object.keys(falsifiable)
    .map((variable) => `${variable} = ${falsifiable[variable] ? "\\mathtt{true}" : "\\mathtt{false}"}`)
    .join(", ")
  return t(translations, lang, "feedback_examples", [falsifiedBy, verifiedBy])
}

export const Satisfiability: QuestionGenerator = {
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["boolean logic", "propositional logic", "propositional calculus", "satisfiability"],
  languages: ["en", "de"],
  author: "Alex Schickedanz",
  license: "MIT",
  expectedParameters: [
    {
      name: "size",
      description: tFunctional(translations, "size"),
      type: "integer",
      min: 2,
      max: 6,
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
    // initialize the RNG so the question can be generated again
    const random = new Random(seed)

    const numLeaves = (<number>parameters.size ?? 2) * 2
    const varNames = random.choice(variableNames).slice(0, numLeaves)
    let expression
    switch (random.int(0, 3)) {
      case 0:
        expression = generateRandomTautology(random, numLeaves, varNames)
        break
      case 1:
        expression = generateRandomContradiction(random, numLeaves, varNames)
        break
      default:
        expression = generateRandomExpression(random, numLeaves, varNames)
        break
    }

    const { satisfiable, falsifiable } = expression.getProperties()

    const correctAnswerIndex = satisfiable === false ? [2, 3] : falsifiable === false ? [0, 1] : [1, 2]

    // generate the question object
    const question: MultipleChoiceQuestion = {
      type: "MultipleChoiceQuestion",
      name: Satisfiability.name(lang),
      path: serializeGeneratorCall({
        generator: Satisfiability,
        lang,
        parameters,
        seed,
        generatorPath,
      }),
      text: t(translations, lang, "text", [expression.toString(true)]),
      answers: [
        t(translations, lang, "answer_tautology"),
        t(translations, lang, "answer_verifiable"),
        t(translations, lang, "answer_falsifiable"),
        t(translations, lang, "answer_contradiction"),
      ],
      allowMultiple: true,
      feedback: minimalMultipleChoiceFeedback({
        correctAnswerIndex,
        feedbackText: getAdditionalFeedbackText(satisfiable, falsifiable, lang),
      }),
    }

    return {
      question,
      // allows for unit tests
      testing: {
        expression,
        correctAnswerIndex,
      },
    }
  },
}
