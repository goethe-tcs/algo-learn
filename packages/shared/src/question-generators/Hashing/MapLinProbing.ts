/** Types for possible hash functions */
export type HashFunction = (key: number, size: number) => number
export type DoubleHashFunction = (key: number, i: number, size: number) => number

/**
 * This is a hash map implementation using linear probing to handle collisions.
 * Only numbers are allowed as keys
 *
 * If the same key is inserted twice, nothing happens
 */
export class MapLinProbing {
  private mapKeys: (number | null)[]
  private readonly size: number
  private amount: number = 0
  private readonly hashFunction: HashFunction | null = null
  private readonly doubleHashFunction: DoubleHashFunction | null = null
  private readonly doubleHashing: boolean = false

  constructor({
    size,
    hashFunction,
  }: {
    size: number
    hashFunction?: HashFunction | DoubleHashFunction
  }) {
    this.mapKeys = new Array(size).fill(null) as (number | null)[]
    this.size = size
    if (hashFunction) {
      if (hashFunction.length === 2) {
        this.hashFunction = hashFunction as HashFunction
      } else if (hashFunction.length === 3) {
        this.doubleHashFunction = hashFunction as DoubleHashFunction
        this.doubleHashing = true
      } else {
        throw new Error("Invalid hash function")
      }
    } else {
      this.hashFunction = this.defaultHashFunction
    }
  }

  /**
   * Inserts a new key into the map
   * @param key
   */
  insert(key: number) {
    if (this.amount >= this.size) {
      throw new Error(`Map is full. Cannot insert key ${key}`)
    }
    let hashKey = this.doubleHashing ? this.getHashValue(key, 0) : this.getHashValue(key)
    let counter = 1
    while (this.mapKeys[hashKey] !== null && this.mapKeys[hashKey] !== key) {
      if (this.doubleHashing) {
        hashKey = this.getHashValue(key, counter)
      } else {
        hashKey = (hashKey + 1) % this.size
      }
      counter++
    }
    this.mapKeys[hashKey] = key
    this.amount++
  }

  /**
   * Deletes a key from the map
   * @param key
   */
  delete(key: number) {
    let hashKey = this.doubleHashing ? this.getHashValue(key, 0) : this.getHashValue(key)
    let counter = 1
    while (this.mapKeys[hashKey] !== key) {
      if (this.doubleHashing) {
        hashKey = this.getHashValue(key, counter)
      } else {
        hashKey = (hashKey + 1) % this.size
      }
      if (this.mapKeys[hashKey] === null || counter > this.getSize()) {
        return
      }
      counter++
    }
    this.mapKeys[hashKey] = null
    this.amount--
    // rehash the following keys
    const keysToRehash: number[] = []
    let count = 1
    hashKey = this.doubleHashing ? this.getHashValue(key, count) : (hashKey + 1) % this.size
    while (this.mapKeys[hashKey] !== null) {
      keysToRehash.push(this.mapKeys[hashKey] as number)
      this.mapKeys[hashKey] = null
      this.amount--
      count++
      hashKey = this.doubleHashing ? this.getHashValue(key, count) : (hashKey + 1) % this.size
    }
    for (const rehashKey of keysToRehash) {
      this.insert(rehashKey)
    }
  }

  /**
   * Returns true if the key is in the map, false otherwise
   * (Simple approach)
   * @param key
   */
  has(key: number): boolean {
    for (const keyOption of this.keys()) {
      if (keyOption === key) return true
    }
    return false
  }

  /**
   * Returns an array of all the keys in the map
   */
  keys(): number[] {
    return this.mapKeys.filter((key) => key !== null)
  }

  /**
   * Returns the keys of the map
   */
  keysList(): (number | null)[] {
    return this.mapKeys
  }

  /**
   * Returns if the map is empty
   */
  isEmpty(): boolean {
    return this.amount === 0
  }

  /**
   * Returns the number of keys in the map
   */
  getAmount(): number {
    return this.amount
  }

  /**
   * Returns the size of the table
   * Maximum amount of possible elements
   */
  getSize(): number {
    return this.size
  }

  /**
   * Clears the map
   */
  clear() {
    this.mapKeys = new Array(this.size).fill(null) as (number | null)[]
    this.amount = 0
  }

  /**
   * Returns the hash value of the key
   * @param key
   * @private
   */
  defaultHashFunction = (key: number): number => {
    return key % this.size
  }

  getHashValue(key: number, i?: number): number {
    if (this.doubleHashing) {
      if (!this.doubleHashFunction) {
        throw new Error("Invalid hash function")
      }
      if (i === undefined) {
        throw new Error("Missing second number for double hashing")
      }
      return this.doubleHashFunction(key, i, this.size) % this.size
    }
    return (
      (this.hashFunction ? this.hashFunction(key, this.size) : this.defaultHashFunction(key)) % this.size
    )
  }

  toString() {
    return this.keysList().toString()
  }
}
