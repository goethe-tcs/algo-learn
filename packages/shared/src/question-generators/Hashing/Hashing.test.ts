import { describe, expect, test } from "vitest"
import { MapLinked } from "./MapLinked.ts"
import { MapLinProbing, type DoubleHashFunction, type HashFunction } from "./MapLinProbing.ts"

function createHashMap<T extends MapLinked | MapLinProbing>(
  type: new (size: number) => T,
  size: number,
): T {
  const hashMap: T = new type(size)
  hashMap.insert(1)
  hashMap.insert(2)
  hashMap.insert(3)
  hashMap.insert(4)
  hashMap.insert(5)
  hashMap.insert(6)

  return hashMap
}

function insertValues(hashMap: MapLinked | MapLinProbing) {
  hashMap.insert(90)
  hashMap.insert(35)
  hashMap.insert(88)
  hashMap.insert(28)
  hashMap.insert(91)
  hashMap.insert(44)
  hashMap.insert(26)
  hashMap.insert(53)
  hashMap.insert(16)
  hashMap.insert(14)
  hashMap.insert(59)

  return hashMap
}

describe("Hashing with Linked List", () => {
  test("Handles (only) inserting followed by toString(), get(), has(), listKeys()", () => {
    const hashMap: MapLinked = new MapLinked(6)
    hashMap.insert(1)
    hashMap.insert(2)
    hashMap.insert(3)
    hashMap.insert(4)
    hashMap.insert(5)
    hashMap.insert(6)
    hashMap.insert(7)
    hashMap.insert(8)
    expect(hashMap.toString()).toEqual("0: 6  \n1: 7 -> 1  \n2: 8 -> 2  \n3: 3  \n4: 4  \n5: 5")

    expect(hashMap.has(1)).toBeTruthy()
    expect(hashMap.has(2)).toBeTruthy()
    expect(hashMap.has(30)).toBeFalsy()

    expect(hashMap.keys()).toEqual([6, 7, 1, 8, 2, 3, 4, 5])
  })

  test("Handles inserting, changing followed by toString(), get(), has()", () => {
    const hashMap = createHashMap(MapLinked, 4)

    expect(hashMap.toString()).toEqual(`0: 4  \n1: 5 -> 1  \n2: 6 -> 2  \n3: 3`)

    expect(hashMap.has(1)).toBeTruthy()
    expect(hashMap.has(2)).toBeTruthy()
    expect(hashMap.has(30)).toBeFalsy()
  })

  test("Handles inserting, changing, deleting followed by toString(), get(), has(), listKeys(), listValues()", () => {
    const hashMap = createHashMap(MapLinked, 4)

    hashMap.delete(1)
    hashMap.delete(5)
    hashMap.delete(6)

    expect(hashMap.toString()).toEqual(`0: 4  \n1: \n2: 2  \n3: 3`)

    expect(hashMap.has(1)).toBeFalsy()
    expect(hashMap.has(2)).toBeTruthy()

    expect(hashMap.keys()).toEqual([4, 2, 3])
  })

  test("Handles entries(), isEmpty(), getAmount(), clear()", () => {
    const hashMap = createHashMap(MapLinked, 4)

    expect(hashMap.keysList()).toEqual([[4], [5, 1], [6, 2], [3]])

    expect(hashMap.isEmpty()).toBeFalsy()
    expect(hashMap.getAmount()).toEqual(6)

    hashMap.clear()

    expect(hashMap.isEmpty()).toBeTruthy()
    expect(hashMap.getAmount()).toEqual(0)
  })

  test("Aufgabe 8.1 Hashing I", () => {
    // f(x) = (13 · x) mod 11
    const hashFunction: HashFunction = (x: number): number => {
      return (13 * x) % 11
    }

    let hashMap = new MapLinked(11, hashFunction)
    hashMap = insertValues(hashMap) as MapLinked

    expect(hashMap.toString()).toEqual(
      "0: 44 -> 88  \n1: 28  \n2: \n3: \n4: 35 -> 90  \n5: \n6: 14 -> 91  \n7: 53  \n8: 59 -> 26  \n9: \n10: 16",
    )
  })
})

describe("Hashing with Linear Probing", () => {
  test("Handles inserting and deleting with collisions", () => {
    const hashMap = new MapLinProbing({ size: 13 })

    hashMap.insert(1)
    hashMap.insert(14)
    hashMap.insert(27)

    hashMap.insert(2)
    hashMap.insert(15)

    expect(hashMap.has(1)).toBeTruthy()
    expect(hashMap.has(14)).toBeTruthy()
    expect(hashMap.has(27)).toBeTruthy()
    expect(hashMap.has(2)).toBeTruthy()
    expect(hashMap.has(15)).toBeTruthy()

    expect(hashMap.keys()).toEqual([1, 14, 27, 2, 15])

    hashMap.delete(1)
    hashMap.delete(27)
  })

  test("Aufgabe 8.1 Hashing I (own single hash function)", () => {
    // f(x) = (13 · x) mod 11
    const hashFunction: HashFunction = (x: number, size: number): number => {
      return (13 * x) % size
    }

    let hashMap = new MapLinProbing({ size: 11, hashFunction })

    hashMap = insertValues(hashMap) as MapLinProbing
    expect(hashMap.has(90)).toBeTruthy()

    expect(hashMap.isEmpty()).toBeFalsy()
    expect(hashMap.getAmount()).toEqual(11)
  })

  test("Aufgabe 8.1 Hashing I c (own double hashing", () => {
    /*
    f(x) = (13 · x) mod 11
    g(x) = 5 − (x mod 5)
    hi(x) = (f(x) + i · g(x)) mod 11)
     */
    const hashFunction: DoubleHashFunction = (x: number, i: number, size: number): number => {
      return (((13 * x) % size) + i * (5 - (x % 5))) % size
    }
    let hashMap = new MapLinProbing({ size: 11, hashFunction })
    hashMap = insertValues(hashMap) as MapLinProbing
    expect(hashMap.toString()).toEqual("88,28,44,14,90,59,91,53,26,35,16")
  })
})
