import type { DoubleHashFunction, HashFunction } from "@shared/question-generators/Hashing/MapLinProbing"
import primesJSON from "@shared/utils/primes.json"
import type Random from "@shared/utils/random.ts"

/**
 * The type of the hash function generator
 * - hashFunction: the hash function, see DoubleHashFunction and HashFunction
 * - hashFunctionString: the string representation of the hash function, as cite in LaTeX
 */
type GenerateHashFuncType = {
  hashFunction: HashFunction | DoubleHashFunction
  hashFunctionString: string
}

/**
 * Generates a hash function based on the type of hashing and the table size
 * @param tableSize - provide for better control over the generated numbers used inside the hash
 *                  - **has to be prime**
 * @param type - type of hashing
 * @param random
 */
export function generateHashFunction(
  tableSize: number,
  type: "linked" | "linear" | "double",
  random: Random,
): () => GenerateHashFuncType {
  /** Standard hashing - can be used for linked and linear */
  const divisionMethod = (): GenerateHashFuncType => {
    function hashFunction(key: number, size: number) {
      return key % size
    }
    const hashFunctionString = `\\[h(x) = x \\bmod ${tableSize}\\]`
    return {
      hashFunction,
      hashFunctionString,
    }
  }

  /** Can be used for linked and linear */
  const universalHashing = (): GenerateHashFuncType => {
    // universal hashing function:
    // h(x) = ((ax + b) mod p) mod m
    // where p is a prime number larger than the universe of keys
    // a [1, p-1], b [0, p-1] random numbers
    const pIndex = random.int(primesJSON.indexOf(tableSize) + 1, primesJSON.indexOf(tableSize) + 4)
    // we can choose a value like this, because there will never be a case
    // where the size of the hashtable is larger than the 11th prime number
    const p = primesJSON[pIndex]
    const a = random.int(2, p - 1)
    const b = random.int(1, p - 1)

    function hashFunction(key: number, size: number) {
      return ((a * key + b) % p) % size
    }
    const hashFunctionString = `\\[h(x) = ((${a} \\cdot x + ${b}) \\bmod ${p}) \\bmod ${tableSize}\\]`
    return {
      hashFunction,
      hashFunctionString,
    }
  }

  /** Can be used only for double */
  const doubleLinearHashing = (): GenerateHashFuncType => {
    const multValue = random.choice([3, 4, 6, 7, 8, 9].filter((v) => v !== tableSize))

    function hashFunction(key: number, i: number, size: number) {
      const f = (multValue * key) % size
      const g = tableSize - (key % (tableSize - 1)) - 1
      return (f + i * g) % size
    }

    const fString = `\\[f(x) = ${multValue} \\cdot x \\bmod ${tableSize}\\]`
    const gString = `\\[g(x) = ${tableSize - 1} - (x \\bmod ${tableSize - 1})\\]`
    const hashFunctionString = `\\[h_i(x) = (f(x) + i \\cdot g(x)) \\bmod ${tableSize}\\]`

    return {
      hashFunction,
      hashFunctionString: fString + "\n\n" + gString + "\n\n" + hashFunctionString,
    }
  }

  if (type === "linear") {
    return random.choice([divisionMethod, universalHashing])
  } else if (type === "linked") {
    return random.choice([divisionMethod, universalHashing])
  } else {
    return doubleLinearHashing
  }
}
