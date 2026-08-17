import type { Language } from "@shared/api/Language"
import type Random from "@shared/utils/random"

export type Domain = "N" | "Z"
export type SetProperty = "even" | "odd" | "prime" | "square" | "multiple" | "congruence"
export type BoundsMode = "auto" | "negOnly" | "posOnly"

/** primality test for small n by trial division */
export function isPrime(n: number): boolean {
  if (n < 2) return false
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false
  }
  return true
}

/** returns true iff x is perfect square */
export const isSquare = (x: number) => {
  const r = Math.floor(Math.sqrt(x))
  return r * r === x
}

/** Symbol for domain */
export const domainLatexSymbol = (dom: Domain) => (dom === "N" ? "\\mathbb{N}" : "\\mathbb{Z}")

/**
 * Implicit minimum element for naturals by property.
 * We omit showing the explicit lower bound if the printed bound is this value.
 */
export function implicitLowerBound(dom: Domain, prop: SetProperty): number | null {
  if (dom !== "N") return null
  switch (prop) {
    case "even":
    case "prime":
      return 2
    case "odd":
    case "square":
      return 1
    default:
      return 1
  }
}

/**
 * Pick numeric bounds (low, high) for display and iteration.
 * Supports all-negative, all-positive, or mixed ranges for integers.
 */
export function pickBounds(
  random: Random,
  dom: Domain,
  targetHigh: number,
  minWidth = 4,
  mode: BoundsMode = "auto",
) {
  const width = Math.max(minWidth, 2)

  if (dom === "N") {
    const high = Math.max(targetHigh, width + 1)
    const maxLow = Math.max(1, high - width)
    const low = random.int(1, maxLow)
    return { low, high }
  }

  if (mode === "negOnly") {
    const highNeg = -random.int(1, Math.max(2, Math.floor(targetHigh / 2) + 1))
    const lowMin = highNeg - Math.max(width, 4)
    const low = random.int(lowMin - width, highNeg - width)
    return { low, high: highNeg }
  }

  if (mode === "posOnly") {
    const high = Math.max(targetHigh, width + 1)
    const low = random.int(0, Math.max(0, high - width))
    return { low, high }
  }

  const high = Math.max(targetHigh, width + 1)
  const maxLow = high - width
  const low = random.int(-high, Math.min(maxLow, high - width))
  return { low, high }
}

/**
 * Choose printed inequality operators and derive inclusive iteration bounds
 * so explicit set equals printed interval respecting strictness
 */
export function chooseInequalities(random: Random, low: number, high: number) {
  let leftOp = random.choice(["<", "\\leq"])
  let rightOp = random.choice(["<", "\\leq"])

  let includeStart = leftOp === "<" ? low + 1 : low
  let includeEnd = rightOp === "<" ? high - 1 : high

  if (includeStart > includeEnd) {
    if (rightOp === "<") {
      rightOp = "\\leq"
      includeEnd = high
    } else if (leftOp === "<") {
      leftOp = "\\leq"
      includeStart = low
    } else {
      includeStart = low
      includeEnd = low
    }
  }

  return { leftOp, rightOp, includeStart, includeEnd }
}

/**
 * For naturals, optionally decorate the domain with its upper bound
 * when the lower bound is omitted due to being implicit.
 */
export function maybeDecorateNaturalDomain(
  dom: Domain,
  rightOp: string,
  high: number,
  omitLower: boolean,
  random: Random,
) {
  if (dom !== "N" || !omitLower) return { latex: domainLatexSymbol(dom), embedsUpper: false }
  const useDecoration = random.choice([true, false])
  if (!useDecoration) return { latex: "\\mathbb{N}", embedsUpper: false }
  const tag = rightOp === "<" ? "<" : "\\leq"
  return { latex: `\\mathbb{N}_{${tag}${high}}`, embedsUpper: true }
}

/**
 * Build textual bounds clause:
 * - omits lower bound if implicit
 * - avoid duplicating the upper bound if domain is already decorated
 */
export function formatBoundsClause(
  dom: Domain,
  prop: SetProperty,
  low: number,
  high: number,
  leftOp: string,
  rightOp: string,
  embedsUpper: boolean,
) {
  const implied = implicitLowerBound(dom, prop)
  const omitLower = implied !== null && (leftOp === "<" ? low + 1 : low) <= implied
  if (omitLower && embedsUpper) return ""
  if (omitLower) return `n ${rightOp} ${high}`
  if (embedsUpper) return `${low} ${leftOp} n`
  return `${low} ${leftOp} n ${rightOp} ${high}`
}

/** Inclusive integer range [a..b] */
export const rangeArray = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

/** Per-row, precomputed config for template instance */
export type TemplateConfig = {
  low: number
  high: number
  leftOp: string
  rightOp: string
  includeStart: number
  includeEnd: number
  domainLatex: string
  embedsUpper: boolean
  residue?: number // for congruence templates
}

export type SetTemplate = {
  generateConfig: (dom: Domain, param: number, random: Random) => TemplateConfig
  labels: (lang: Language, dom: Domain, param: number, cfg: TemplateConfig) => string[]
  build: (dom: Domain, param: number, cfg: TemplateConfig) => number[]
  paramRange: (random: Random) => number
  confounderStrategies?: readonly ConfounderStrategy[]
}

export type ConfounderStrategy = "random" | "dropEdge" | "dropAny" | "extend" | "resample"

export type ConfounderResult = {
  strategy: ConfounderStrategy
  values: number[]
}

export function generateConfounder(
  base: number[],
  template: SetTemplate,
  random: Random,
): ConfounderResult | null {
  const strategies = template.confounderStrategies ?? ["random", "dropEdge", "extend", "resample"]

  const strategy = random.choice(strategies)

  switch (strategy) {
    case "random": {
      const v = randomConfounder(random)
      return { strategy, values: v }
    }
    case "dropEdge": {
      const v = dropEdge(base, random)
      return v ? { strategy, values: v } : null
    }

    case "dropAny": {
      const v = dropAny(base, random)
      return v ? { strategy, values: v } : null
    }

    case "extend": {
      const v = extendByGap(base, random)
      return v ? { strategy, values: v } : null
    }

    case "resample": {
      const v = resampleWithinBounds(base, random)
      return v ? { strategy, values: v } : null
    }
  }
}

export function randomConfounder(random: Random): number[] {
  return Array.from({ length: random.int(1, 5) }, () => random.int(-10, 20)).sort((a, b) => a - b)
}
export function dropEdge(base: number[], random: Random): number[] | null {
  if (base.length <= 2) return null
  return random.choice([true, false]) ? base.slice(1) : base.slice(0, -1)
}

export function dropAny(base: number[], random: Random): number[] | null {
  if (base.length <= 2) return null
  const i = random.int(0, base.length - 1)
  return base.filter((_, idx) => idx !== i)
}

export function averageGap(arr: number[]): number {
  if (arr.length < 2) return 1
  let sum = 0
  for (let i = 1; i < arr.length; i++) {
    sum += arr[i] - arr[i - 1]
  }
  return Math.max(1, Math.round(sum / (arr.length - 1)))
}

export function extendByGap(base: number[], random: Random): number[] | null {
  if (base.length < 2) return null
  const gap = averageGap(base)
  return random.choice([true, false]) ? [...base, base[base.length - 1] + gap] : [base[0] - gap, ...base]
}

export function resampleWithinBounds(base: number[], random: Random, maxSize = 10): number[] | null {
  if (base.length < 3) return null

  const low = base[0]
  const high = base[base.length - 1]
  const width = high - low
  if (width < 2) return null

  const avg = averageGap(base)

  const possibleSteps: number[] = []
  for (let d = 1; d <= width; d++) {
    if (width % d === 0 && d !== avg) possibleSteps.push(d)
  }

  if (possibleSteps.length === 0) return null

  const step = random.choice(possibleSteps)
  const result: number[] = []

  for (let x = low; x <= high; x += step) {
    result.push(x)
    if (result.length > maxSize) return null
  }

  if (result.length < 2) return null
  return result
}

export function parseLatexSet(latex: string): number[] {
  return latex
    .replace(/[{}$\\]/g, "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
}
