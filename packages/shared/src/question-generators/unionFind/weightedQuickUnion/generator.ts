import type { QuestionGenerator } from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { unionFindStartQuestion } from "@shared/question-generators/unionFind/utilsStart.ts"
import { WeightedQuickUnion } from "@shared/question-generators/unionFind/weightedQuickUnion/algorithm.ts"
import Random from "@shared/utils/random.ts"
import { tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Weighted-Quick-Union",
    description: "Determine the Weighted-Quick-Union state after Union operation",
    task: `A state of the **Weighted-Quick-Union** data structure is given as the following array: \n{{0}}\n We call \`Union({{1}}, {{2}})\`. Provide the resulting state. {{3}}
    *Note: Compare the size of the trees.*`,
  },
  de: {
    name: "Weighted-Quick-Union",
    description: "Bestimme den Weighted-Quick-Union-Zustand nach Union-Operation",
    task: `Ein Zustand der **Weighted-Quick-Union** Datenstruktur ist als folgendes Array gegeben: \n{{0}}\n Wir rufen \`Union({{1}}, {{2}})\` auf. Gib den Zustand an, der dadurch entsteht. {{3}}
    *Hinweis: Vergleich die Größe der Bäume.*`,
  },
}

export const WeightedQuickUnionGenerator: QuestionGenerator = {
  id: "ufwqu",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["union-find", "quick-find"],
  languages: ["en", "de"],
  expectedParameters: [],

  generate(lang, parameters, seed) {
    const permalink = serializeGeneratorCall({
      generator: WeightedQuickUnionGenerator,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)

    const unionSize = random.int(7, 8)
    const union = new WeightedQuickUnion(unionSize)

    return {
      question: unionFindStartQuestion({
        random,
        union,
        unionSize,
        lang,
        permalink,
        translations,
        name: WeightedQuickUnionGenerator.name(lang),
      }),
    }
  },
}
