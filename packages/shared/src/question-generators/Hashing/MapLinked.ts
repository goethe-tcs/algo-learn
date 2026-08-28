import type { HashFunction } from "@shared/question-generators/Hashing/MapLinProbing"

/**
 * This is a hash map implementation using linked list to handle collisions
 * The hash function is the modulo of the key by the size of the map * is an array of linked lists
 *
 * If the same key is inserted twice, the value of the first insert is updated
 */
export class MapLinked {
  private map: (ListNode | null)[]
  private readonly size: number
  private amount: number = 0
  private readonly hashFunction: HashFunction

  constructor(size: number, hashFunction?: HashFunction) {
    this.map = new Array(size).fill(null) as (ListNode | null)[]
    this.size = size
    this.hashFunction = hashFunction ? hashFunction : this.defaultHashFunction
  }

  /**
   * Inserts a new key into the map
   * @param key
   */
  insert(key: number) {
    const hashKey = this.hashFunction(key, this.size)
    if (this.has(key)) {
      return
    }
    const newNode: ListNode = { key: key, next: this.map[hashKey], prev: null }
    // insert the new node at the beginning
    this.map[hashKey] = newNode
    // update the previous node
    if (newNode.next) {
      newNode.next.prev = newNode
    }
    this.amount++
  }

  /**
   * Deletes a key from the map
   * @param key
   */
  delete(key: number) {
    const hashKey = this.hashFunction(key, this.size)
    let node = this.map[hashKey]
    if (!node) {
      return
    }
    // base case (key at the start of the list)
    if (node.key === key) {
      this.amount--
      this.map[hashKey] = node.next
      if (node.next) {
        node.next.prev = null
      }
      return
    }
    while (node.next) {
      if (node.next.key === key) {
        this.amount--
        node.next = node.next.next
        if (node.next) {
          node.next.prev = node
        }
        return
      }
      node = node.next
    }
  }

  /**
   * Returns if the key is in the map
   * @param key
   */
  has(key: number): boolean {
    const hashKey = this.hashFunction(key, this.size)
    let node = this.map[hashKey]
    while (node) {
      if (node.key === key) {
        return true
      }
      node = node.next
    }
    return false
  }

  /**
   * Returns an array of all the keys in the map
   */
  keys(): number[] {
    return this.keysList().flat()
  }

  /**
   * Returns an array of all the keys in the map as a list of lists
   * Example:
   *  [[1, 11, 21], [3, 13]]
   */
  keysList(): number[][] {
    const keys: number[][] = []
    this.map.forEach((node) => {
      const keyList: number[] = []
      while (node) {
        keyList.push(node.key)
        node = node.next
      }
      keys.push(keyList)
    })
    return keys
  }

  /**
   * Returns true if the map is empty
   */
  isEmpty(): boolean {
    return this.getAmount() === 0
  }

  /**
   * Returns the number of key-value pairs in the map
   */
  getAmount(): number {
    return this.amount
  }

  getSize(): number {
    return this.size
  }

  /**
   * Clears the map
   */
  clear() {
    this.map = new Array(this.size).fill(null) as ListNode[] | null[]
    this.amount = 0
  }

  /**
   * Returns the hash value of the key
   * @param key
   * @param size just this.size
   * @private
   */
  private defaultHashFunction = (key: number, size: number): number => {
    return key % size
  }

  /**
   * Returns a string representation of the map
   *
   * Example:
   * 0: 1 -> 11 -> 21
   * 1:
   * 2: 3 -> 13
   */
  toString() {
    return this.map
      .map((node, index) => {
        let str = `${index}: `
        while (node) {
          str += `${node.key} ${node.next ? "->" : ""} `
          node = node.next
        }
        return str
      })
      .join("\n")
      .trim()
  }
}

/** Simple type as helper only for MapLinked */
type ListNode = {
  key: number
  next: ListNode | null
  prev: ListNode | null
}
