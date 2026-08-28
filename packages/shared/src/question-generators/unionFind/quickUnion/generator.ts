import type { QuestionGenerator } from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { QuickUnion } from "@shared/question-generators/unionFind/quickUnion/algorithm.ts"
import { unionFindStartQuestion } from "@shared/question-generators/unionFind/utilsStart.ts"
import Random from "@shared/utils/random.ts"
import { tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Quick-Union",
    description: "Determine the Quick-Union state after Union operation",
    task: `A state of the **Quick-Union** data structure is given as the following array: \n{{0}}\n We call \`Union({{1}}, {{2}})\`. Provide the resulting state. {{3}}`,
  },
  de: {
    name: "Quick-Union",
    description: "Bestimme den Quick-Union-Zustand nach Union-Operation",
    task: `Ein Zustand der **Quick-Union** Datenstruktur ist als folgendes Array gegeben: \n{{0}}\n Wir rufen \`Union({{1}}, {{2}})\` auf. Gib den Zustand an, der dadurch entsteht. {{3}}`,
  },
}

export const QuickUnionGenerator: QuestionGenerator = {
  id: "ufqu",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["union-find", "quick-find"],
  languages: ["en", "de"],
  expectedParameters: [],

  generate(lang, parameters, seed) {
    const permalink = serializeGeneratorCall({
      generator: QuickUnionGenerator,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)

    const unionSize = random.int(7, 8)
    const union = new QuickUnion(unionSize)

    return {
      question: unionFindStartQuestion({
        random,
        union,
        unionSize,
        lang,
        permalink,
        translations,
        name: QuickUnionGenerator.name(lang),
      }),
    }
  },
}
