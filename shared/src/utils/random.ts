/** The length of base36-seed strings */
export const SEED_LENGTH = 7

/** Sample a uniformly random seed from Math.random(). */
export function sampleRandomSeed(): string {
  return new Random(Math.random()).base36string(SEED_LENGTH)
}

/** Class for generating random numbers from a given seed. */
export default class Random {
  /**
   * Creates a new Random object.
   *
   * @param seed - A string or number to use as a seed.
   * @returns A new Random object.
   */
  constructor(seed: string | number) {
    if (typeof seed === "number") {
      seed = seed.toString()
    }
    const nextSeed = xmur3(seed)
    this.uniform = sfc32(nextSeed(), nextSeed(), nextSeed(), nextSeed())
  }

  /** Returns a random number between 0 (inclusive) and 1 (exclusive). */
  uniform: () => number

  /**
   * Returns a random number.
   *
   * @param min - The minimum number.
   * @param max - The maximum number.
   * @returns A random number between min (inclusive) and max (exclusive).
   */
  float(min: number, max: number): number {
    return this.uniform() * (max - min) + min
  }

  /**
   * Returns a random boolean
   * @param chanceToBeTrue - The chance that the result is true
   */
  bool(chanceToBeTrue: number = 0.5): boolean {
    return this.uniform() < chanceToBeTrue
  }

  /**
   * Returns a random integer.
   *
   * @param min - The minimum number.
   * @param max - The maximum number.
   * @returns A random integer between min (inclusive) and max (inclusive).
   */
  int(min: number, max: number): number {
    if (min > max) throw new Error("Value Error: min > max")
    if (min === max) return min
    return Math.floor(this.float(min, max + 1))
  }

  /**
   * Splits an input number into an array of random numbers that sum up to the input number
   * @param input the number to split
   * @param numSplits how often the number is split
   * @param min the minimal value a random split must have
   * @param max the maximal value a random split must have
   */
  split(
    input: number,
    numSplits: number,
    min: number = 0,
    max: number | undefined = undefined,
  ): number[] {
    if (max === undefined) max = input
    if (numSplits < 1) throw new Error("Value Error: numSplits needs to be positive")
    if (numSplits * min > input)
      throw new Error(
        "Value Error: input cannot be split into numSplits values that are at least min big",
      )
    if (numSplits * max < input)
      throw new Error(
        "Value Error: input cannot be split into numSplits values that are at most max big",
      )

    let leftToSplit = input
    const result = []
    for (let i = 0; i < numSplits - 1; i++) {
      const nextInt = this.int(
        Math.max(min, leftToSplit - (numSplits - i - 1) * max),
        Math.min(max, leftToSplit - (numSplits - i - 1) * min),
      )
      leftToSplit -= nextInt
      result.push(nextInt)
    }

    result.push(leftToSplit)
    return this.shuffle(result)
  }

  /**
   * Chooses a uniformly random element from an array.
   *
   * @param array - An array of elements.
   * @returns A random element from the array.
   */
  choice<T>(array: ReadonlyArray<T>): T {
    return array[this.int(0, array.length - 1)]
  }

  /**
   * Chooses a uniformly random fixed-size subset from an array.
   *
   * @param array - An array of elements.
   * @param size - The size of the subset.
   * @returns A list of size distinct elements from the array.
   */
  subset<T>(array: ReadonlyArray<T>, size: number): Array<T> {
    if (size > array.length) {
      throw new Error("Subset size cannot be larger than the array size")
    }
    const copy = array.slice()
    this.shuffle(copy)
    return copy.slice(0, size)
  }

  /**
   * Splits an array into two random disjoint subsets of arrays such that their union is the full array
   * @param array
   * @param size Size of the first array. If not provided a random number is chosen.
   */
  splitArray<T>(array: ReadonlyArray<T>, size?: number): Array<T>[] {
    if (size === undefined) size = this.int(1, array.length - 1)

    if (size > array.length) {
      throw new Error("Subset size cannot be larger than the array size")
    }

    const copy = array.slice()
    this.shuffle(copy)

    return [copy.slice(0, size), copy.slice(size, array.length)]
  }

  /**
   * Chooses a random index from an array of weights that is interpreted as a
   * probability distribution.
   *
   * @param weights - An array of weights.
   * @returns A random index from the array.
   */
  weightedIndex(weights: number[]): number {
    const sumOfWeights = weights.reduce((acc, weight) => acc + weight, 0)
    const randomValue = this.float(0, sumOfWeights)
    let accumulatedWeight = 0
    for (let i = 0; i < weights.length; i++) {
      accumulatedWeight += weights[i]
      if (randomValue < accumulatedWeight) {
        return i
      }
    }

    // This should never be reached, but return the first index as a fallback
    return 0
  }

  /**
   * Chooses a random element from an array of weighted elements.
   * @param elements
   * @param weights
   * @returns A random element from the array.
   */
  weightedChoice<T>(elements: ReadonlyArray<T>, weights: number[]): T
  /**
   * Chooses a random element from an array of weighted elements.
   * @param choicesAndWeights An array of element-weight tuples
   * @returns A random element from the array.
   */
  weightedChoice<T>(choicesAndWeights: ReadonlyArray<[element: T, weight: number]>): T
  weightedChoice<T>(
    data: ReadonlyArray<[element: T, weight: number]> | ReadonlyArray<T>,
    weights: number[] | undefined = undefined,
  ): T {
    let elements: readonly T[]

    if (weights === undefined) {
      elements = (data as ReadonlyArray<[element: T, weight: number]>).map((w) => w[0])
      weights = (data as ReadonlyArray<[element: T, weight: number]>).map((w) => w[1])
    } else {
      elements = data as ReadonlyArray<T>
    }

    return elements[this.weightedIndex(weights)]
  }

  /**
   * Shuffles array in place using Durstenfeld's shuffle algorithm.
   *
   * @param array - An array containing the items.
   * @returns A reference to the same array, now shuffled.
   */
  shuffle<T>(array: Array<T>): Array<T> {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(0, i)
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  /**
   * Generates a random base36 string of a given length.
   *
   * @param length - The length of the string to generate. (default:
   *   SEED_LENGTH)
   * @returns A random base36 string of the given length.
   */
  base36string(length: number = SEED_LENGTH): string {
    const str = []
    for (let i = 0; i < length; i++) {
      str.push(this.int(0, 35).toString(36))
    }
    return str.join("")
  }
}

/**
 * Hashes a string into a sequence of 32-bit integers.
 *
 * @param str - The string to hash
 * @returns Each call to this function returns the next 32-bit hash
 * @see https://github.com/bryc/code/blob/master/jshash/PRNGs.md#addendum-a-seed-generating-functions
 */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}

/**
 * Pseudorandom number generator using the SFC32 algorithm.
 *
 * @param a - The first 32-bit seed
 * @param b - The second 32-bit seed
 * @param c - The third 32-bit seed
 * @param d - The fourth 32-bit seed
 * @returns Each call to this function returns the next random number
 * @see https://github.com/bryc/code/blob/master/jshash/PRNGs.md#sfc32
 */
export function sfc32(a: number, b: number, c: number, d: number): () => number {
  a |= 0
  b |= 0
  c |= 0
  d |= 0
  return function () {
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}
