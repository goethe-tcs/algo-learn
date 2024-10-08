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

  /** Returns a random number from the standard normal distribution. */
  normal(): number {
    let u = 0
    let v = 0
    while (u === 0) u = this.uniform()
    while (v === 0) v = this.uniform()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

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
   * Returns a random integer from the uniform distribution on [min, max].
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
   * Returns a random integer (normal distribution)
   *
   * The function tries to generate a number within the range of min and max.
   * If it fails to do so after 10 tries, it returns the mean value.
   *
   * So not perfect, because usually normal distribution does not have a min and max.
   *
   * @param min - The minimum number
   * @param max - The maximum number
   * @param mean - The expected value (average)
   * @param stdev - The standard deviation
   */
  intNormal(min: number, max: number, mean = Math.round((min + max) / 2), stdev = 1): number {
    let value = 0
    // try 10 times to generate a value within min and max
    // so the probability of failing gets smaller
    // otherwise return either min or max
    for (let i = 0; i < 10; i++) {
      const normal = this.normal()
      value = Math.round(normal * stdev + mean)
      if (value >= min && value <= max) {
        return value
      }
    }
    // return min if value close to min, max if value close to max
    return Math.abs(value - min) < Math.abs(value - max) ? min : max
  }

  /**
   * Generates a uniform random integer partition of input into numParts parts
   * where each part is at least minPartSize big.
   * @param input the number to partition
   * @param numParts the number of parts in the partition
   * @param minPartSize the minimal value a random split must have
   */
  partition(input: number, numParts: number, minPartSize: number = 0): number[] {
    if (numParts < 1) throw new Error("Value Error: numSplits needs to be positive")
    if (minPartSize < 0) throw new Error("Value Error: min needs to be non-negative")
    if (numParts * minPartSize > input)
      throw new Error(
        "Value Error: input cannot be partitioned into numSplits values that are at least min big",
      )

    // handle trivial case
    if (numParts === 1) return [input]

    const maxBoundaryPosition = input - minPartSize * numParts + numParts - 1

    // draw random subset of {1,2,...,maxBoundaryPosition}
    let boundaries: number[] = []
    if (maxBoundaryPosition < 2 * numParts) {
      // optimize for small input / big numParts => generate full list and get random subset
      const tmp = Array.from({ length: maxBoundaryPosition }, (_, i) => i + 1)
      boundaries = this.subset(tmp, numParts - 1)
    } else {
      // optimize for big input / small numParts => rejection sampling
      let boundary
      for (let i = 0; i < numParts - 1; i++) {
        do {
          boundary = this.int(1, maxBoundaryPosition)
        } while (boundaries.includes(boundary))
        boundaries.push(boundary)
      }
    }

    boundaries.sort()

    // turn boundaries into partition
    const partition: number[] = [boundaries[0] - 1 + minPartSize]
    for (let i = 1; i < boundaries.length; i++) {
      partition.push(boundaries[i] - boundaries[i - 1] - 1 + minPartSize)
    }
    partition.push(maxBoundaryPosition - boundaries[boundaries.length - 1] + minPartSize)

    return partition
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
  splitArray<T>(array: ReadonlyArray<T>, size: number): Array<T>[] {
    if (size <= 0 || size > array.length) {
      throw new Error("Subset size has to be in [0, array.length-1]")
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
  weightedIndex(weights: readonly number[]): number {
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
    weights?: number[],
  ): T {
    if (data.length === 0) throw new Error("Value Error: no elements to choose from.")

    let elements: readonly T[]
    let tmpWeights: readonly number[]

    function isSingleValueCall(_: any, weights: any): _ is ReadonlyArray<[element: T, weight: number]> {
      return weights === undefined
    }

    if (isSingleValueCall(data, weights)) {
      elements = data.map((w) => w[0])
      tmpWeights = data.map((w) => w[1])
    } else {
      elements = data
      tmpWeights = weights ?? []
    }

    if (tmpWeights === undefined || elements.length !== tmpWeights.length)
      throw new Error("Value Error: number of elements and number of weights are not equal.")

    return elements[this.weightedIndex(tmpWeights)]
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
