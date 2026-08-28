import type { QuestionGenerator } from "@shared/api/QuestionGenerator.ts"
import { serializeGeneratorCall } from "@shared/api/QuestionRouter.ts"
import { unionFindStartQuestion } from "@shared/question-generators/unionFind/utilsStart.ts"
import { WeightedQuickUnionPath } from "@shared/question-generators/unionFind/weightedQuickUnionPath/algorithm.ts"
import Random from "@shared/utils/random.ts"
import { tFunctional, type Translations } from "@shared/utils/translations.ts"

const translations: Translations = {
  en: {
    name: "Weighted-Quick-Union with path compression",
    description: "Determine the Weighted-Quick-Union with path compression state after Union operation",
    task: `An artificially created state of the **Weighted-Quick-Union with path compression** data structure is given as the following array: \n{{0}}\n We call \`Union({{1}}, {{2}})\`. Provide the resulting state. {{3}}`,
  },
  de: {
    name: "Weighted-Quick-Union mit Pfadverkürzung",
    description: "Bestimme den Weighted-Quick-Union mit Pfadverkürzung Zustand nach Union-Operation",
    task: `Ein künstlich erstellter Zustand der **Weighted-Quick-Union mit Pfadverkürzung** Datenstruktur ist als folgendes Array gegeben: \n{{0}}\n Wir rufen \`Union({{1}}, {{2}})\` auf. Gib den Zustand an, der dadurch entsteht. {{3}}`,
  },
}

export const WeightedQuickUnionPathGenerator: QuestionGenerator = {
  id: "ufwqup",
  name: tFunctional(translations, "name"),
  description: tFunctional(translations, "description"),
  tags: ["union-find", "quick-find"],
  languages: ["en", "de"],
  expectedParameters: [],

  generate(lang, parameters, seed) {
    const permalink = serializeGeneratorCall({
      generator: WeightedQuickUnionPathGenerator,
      lang,
      parameters,
      seed,
    })
    const random = new Random(seed)

    const unionSize = random.int(7, 8)
    const union = new WeightedQuickUnionPath(unionSize)

    return {
      question: unionFindStartQuestion({
        random,
        union,
        unionSize,
        lang,
        permalink,
        translations,
        name: WeightedQuickUnionPathGenerator.name(lang),
      }),
    }
  },
}
