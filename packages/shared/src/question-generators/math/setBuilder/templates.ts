import type { Language } from "@shared/api/Language"
import { t } from "@shared/utils/translations"
import {
  chooseInequalities,
  domainLatexSymbol,
  formatBoundsClause,
  implicitLowerBound,
  isPrime,
  isSquare,
  maybeDecorateNaturalDomain,
  pickBounds,
  rangeArray,
  type BoundsMode,
  type SetProperty,
  type SetTemplate,
} from "./helpers"
import { translations } from "./translations"

export const templates: SetTemplate[] = [
  // even numbers
  {
    generateConfig: (dom, n, random) => {
      const prop: SetProperty = "even"
      const mode: BoundsMode = dom === "Z" && random.choice([true, false]) ? "negOnly" : "auto"
      const { low, high } = pickBounds(random, dom, n, 4, mode)
      const { leftOp, rightOp, includeStart, includeEnd } = chooseInequalities(random, low, high)
      const implied = implicitLowerBound(dom, prop)
      const omitLower = implied !== null && (leftOp === "<" ? low + 1 : low) <= implied
      const natDecor = maybeDecorateNaturalDomain(dom, rightOp, high, omitLower, random)
      const domainLatex = dom === "N" ? natDecor.latex : domainLatexSymbol(dom)
      return {
        low,
        high,
        leftOp,
        rightOp,
        includeStart,
        includeEnd,
        domainLatex,
        embedsUpper: natDecor.embedsUpper,
      }
    },
    labels: (lang: Language, dom, _n, cfg) => {
      const even = t(translations, lang, "even")
      const bounds = formatBoundsClause(
        dom,
        "even",
        cfg.low,
        cfg.high,
        cfg.leftOp,
        cfg.rightOp,
        cfg.embedsUpper,
      )
      const clause = bounds ? `, ${bounds}` : ""
      return [
        `\\{ n \\in ${cfg.domainLatex} : n \\text{ ${even}}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : n \\equiv 0 \\pmod{2}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : \\exists k \\in ${cfg.domainLatex}, n = 2k${clause} \\}`,
      ]
    },
    build: (dom, _n, cfg) => {
      const start = dom === "N" ? Math.max(1, cfg.includeStart) : cfg.includeStart
      const arr: number[] = []
      for (let x = start; x <= cfg.includeEnd; x++) if (x % 2 === 0) arr.push(x)
      return arr
    },
    paramRange: (random) => random.int(10, 40),
  },

  // odd numbers
  {
    generateConfig: (dom, n, random) => {
      const prop: SetProperty = "odd"
      const mode: BoundsMode = dom === "Z" && random.choice([true, false]) ? "negOnly" : "auto"
      const { low, high } = pickBounds(random, dom, n, 4, mode)
      const { leftOp, rightOp, includeStart, includeEnd } = chooseInequalities(random, low, high)
      const implied = implicitLowerBound(dom, prop)
      const omitLower = implied !== null && (leftOp === "<" ? low + 1 : low) <= implied
      const natDecor = maybeDecorateNaturalDomain(dom, rightOp, high, omitLower, random)
      const domainLatex = dom === "N" ? natDecor.latex : domainLatexSymbol(dom)
      return {
        low,
        high,
        leftOp,
        rightOp,
        includeStart,
        includeEnd,
        domainLatex,
        embedsUpper: natDecor.embedsUpper,
      }
    },
    labels: (lang: Language, dom, _n, cfg) => {
      const odd = t(translations, lang, "odd")
      const bounds = formatBoundsClause(
        dom,
        "odd",
        cfg.low,
        cfg.high,
        cfg.leftOp,
        cfg.rightOp,
        cfg.embedsUpper,
      )
      const clause = bounds ? `, ${bounds}` : ""
      return [
        `\\{ n \\in ${cfg.domainLatex} : n \\text{ ${odd}}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : n \\equiv 1 \\pmod{2}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : \\exists k \\in ${cfg.domainLatex}, n = 2k+1${clause} \\}`,
      ]
    },
    build: (dom, _n, cfg) => {
      const start = dom === "N" ? Math.max(1, cfg.includeStart) : cfg.includeStart
      const arr: number[] = []
      for (let x = start; x <= cfg.includeEnd; x++) if (x % 2 !== 0) arr.push(x)
      return arr
    },
    paramRange: (random) => random.int(10, 40),
  },

  // primes in N
  {
    generateConfig: (_dom, n, random) => {
      const low = 2
      const high = n
      const { leftOp, rightOp, includeStart, includeEnd } = chooseInequalities(random, low, high)
      const natDecor = maybeDecorateNaturalDomain("N", rightOp, high, true, random)
      return {
        low,
        high,
        leftOp,
        rightOp,
        includeStart,
        includeEnd,
        domainLatex: natDecor.latex,
        embedsUpper: natDecor.embedsUpper,
      }
    },
    labels: (lang: Language, _dom, _n, cfg) => {
      const prime = t(translations, lang, "prime")
      const bounds = formatBoundsClause(
        "N",
        "prime",
        cfg.low,
        cfg.high,
        cfg.leftOp,
        cfg.rightOp,
        cfg.embedsUpper,
      )
      const clause = bounds ? `, ${bounds}` : ""
      return [
        `\\{ n \\in ${cfg.domainLatex} : n \\geq 2, n \\text{ ${prime}}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : n \\geq 2, \\forall d \\in \\mathbb{N}, (d \\mid n \\Rightarrow (d=1 \\lor d=n))${clause} \\}`,
      ]
    },
    build: (_dom, _n, cfg) => {
      const start = Math.max(2, cfg.includeStart)
      const end = cfg.includeEnd
      return start <= end ? rangeArray(start, end).filter(isPrime) : []
    },
    paramRange: (random) => random.int(20, 50),
    confounderStrategies: ["random", "dropAny", "resample"],
  },

  // multiples of m in N or Z
  {
    generateConfig: (dom, m, random) => {
      const prop: SetProperty = "multiple"
      const cap = 3 * m
      const mode: BoundsMode = dom === "Z" && random.choice([true, false]) ? "negOnly" : "auto"
      const { low, high } = pickBounds(random, dom, cap, 4, mode)
      const { leftOp, rightOp, includeStart, includeEnd } = chooseInequalities(random, low, high)
      const implied = implicitLowerBound(dom, prop)
      const omitLower = implied !== null && (leftOp === "<" ? low + 1 : low) <= implied
      const natDecor = maybeDecorateNaturalDomain(dom, rightOp, high, omitLower, random)
      const domainLatex = dom === "N" ? natDecor.latex : domainLatexSymbol(dom)
      return {
        low,
        high,
        leftOp,
        rightOp,
        includeStart,
        includeEnd,
        domainLatex,
        embedsUpper: natDecor.embedsUpper,
      }
    },
    labels: (_lang: Language, dom, m, cfg) => {
      const bounds = formatBoundsClause(
        dom,
        "multiple",
        cfg.low,
        cfg.high,
        cfg.leftOp,
        cfg.rightOp,
        cfg.embedsUpper,
      )
      const clause = bounds ? `, ${bounds}` : ""
      return [
        `\\{ n \\in ${cfg.domainLatex} : ${m} \\mid n${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : \\exists k \\in ${cfg.domainLatex}, n = k \\cdot ${m}${clause} \\}`,
      ]
    },
    build: (dom, m, cfg) => {
      const start = dom === "N" ? Math.max(1, cfg.includeStart) : cfg.includeStart
      const arr: number[] = []
      for (let x = start; x <= cfg.includeEnd; x++) if (x % m === 0) arr.push(x)
      return arr
    },
    paramRange: (random) => random.int(3, 15),
  },

  // squares in N
  {
    generateConfig: (_dom, n, random) => {
      const low = 1
      const high = n
      const { leftOp, rightOp, includeStart, includeEnd } = chooseInequalities(random, low, high)
      const natDecor = maybeDecorateNaturalDomain("N", rightOp, high, true, random)
      return {
        low,
        high,
        leftOp,
        rightOp,
        includeStart,
        includeEnd,
        domainLatex: natDecor.latex,
        embedsUpper: natDecor.embedsUpper,
      }
    },
    labels: (lang: Language, _dom, _n, cfg) => {
      const square = t(translations, lang, "square")
      const bounds = formatBoundsClause(
        "N",
        "square",
        cfg.low,
        cfg.high,
        cfg.leftOp,
        cfg.rightOp,
        cfg.embedsUpper,
      )
      const clause = bounds ? `, ${bounds}` : ""
      return [
        `\\{ n \\in ${cfg.domainLatex} : n \\text{ ${square}}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : \\exists k \\in \\mathbb{N}, n = k^2${clause} \\}`,
      ]
    },
    build: (_dom, _n, cfg) => rangeArray(cfg.includeStart, cfg.includeEnd).filter(isSquare),
    paramRange: (random) => random.int(30, 80),
    confounderStrategies: ["random", "dropEdge", "extend", "resample"],
  },

  // congruence in N or Z
  {
    generateConfig: (dom, m, random) => {
      const cap = 3 * m
      const mode: BoundsMode = dom === "Z" && random.choice([true, false]) ? "negOnly" : "auto"
      const { low, high } = pickBounds(random, dom, cap, 4, mode)
      const { leftOp, rightOp, includeStart, includeEnd } = chooseInequalities(random, low, high)
      const implied = implicitLowerBound(dom, "congruence")
      const omitLower = implied !== null && (leftOp === "<" ? low + 1 : low) <= implied
      const natDecor = maybeDecorateNaturalDomain(dom, rightOp, high, omitLower, random)
      const domainLatex = dom === "N" ? natDecor.latex : domainLatexSymbol(dom)
      const residue = m > 1 ? random.int(1, m - 1) : 0
      return {
        low,
        high,
        leftOp,
        rightOp,
        includeStart,
        includeEnd,
        domainLatex,
        embedsUpper: natDecor.embedsUpper,
        residue,
      }
    },
    labels: (_lang: Language, dom, m, cfg) => {
      const bounds = formatBoundsClause(
        dom,
        "congruence",
        cfg.low,
        cfg.high,
        cfg.leftOp,
        cfg.rightOp,
        cfg.embedsUpper,
      )
      const clause = bounds ? `, ${bounds}` : ""
      const rVal = cfg.residue ?? 0
      return [
        `\\{ n \\in ${cfg.domainLatex} : n \\equiv ${rVal} \\pmod{${m}}${clause} \\}`,
        `\\{ n \\in ${cfg.domainLatex} : \\exists k \\in ${cfg.domainLatex}, n = k \\cdot ${m} + ${rVal}${clause} \\}`,
      ]
    },
    build: (dom, m, cfg) => {
      const start = dom === "N" ? Math.max(1, cfg.includeStart) : cfg.includeStart
      const rVal = cfg.residue ?? 0
      const arr: number[] = []
      for (let x = start; x <= cfg.includeEnd; x++) if ((x - rVal) % m === 0) arr.push(x)
      return arr
    },
    paramRange: (random) => random.int(4, 12),
    confounderStrategies: ["random", "dropEdge", "extend", "resample"],
  },
]
