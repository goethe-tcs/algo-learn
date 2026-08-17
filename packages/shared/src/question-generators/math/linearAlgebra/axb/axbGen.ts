import type { QuestionGenerator } from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { generateVariantStartAxb } from "@shared/question-generators/math/linearAlgebra/axb/start.ts"
import Random from "@shared/utils/random.ts"
import { tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Linear System of Equations",
    description: "Solve a linear system of equations",
    text: `Solve $Ax=b$ for $x$, given $A$ and $b$ as follows:
    \\[ A={{0}} \\quad b={{1}}\\]
    Provide a possible solution for $x$.
    {{2}}`,
    validationOnlyNumbers: "Please enter just numerals.",
  },
  de: {
    name: "Lineares Gleichungssystem",
    description: "Löse ein lineares Gleichungssystem",
    text: `Löse $Ax=b$ für $x$, gegeben $A$ und $b$ wie folgt:
    \\[ A={{0}} \\quad b={{1}} \\]
    Gib eine mögliche Lösung für $x$ an.
    {{2}}`,
    validationOnlyNumbers: "Bitte gib nur Zahlen ein.",
  },
}

export const AxbGenerator: QuestionGenerator = {
  id: "axbdir",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  languages: ["en", "de"],
  expectedParameters: [
    {
      name: "size",
      description: tFunctional(translations, "param_size"),
      type: "integer",
      min: 2,
      max: 4,
    },
  ],

  generate: (lang, parameters, seed) => {
    const permalink = serializeGeneratorCall({
      generator: AxbGenerator,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)
    const matrixSize = (parameters.size as number) ?? 2

    return generateVariantStartAxb(matrixSize, translations, random, lang, permalink)
  },
}
