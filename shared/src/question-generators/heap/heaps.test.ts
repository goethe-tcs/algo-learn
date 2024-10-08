import { describe, expect, test } from "vitest"
import { MaxHeap, MinHeap } from "./heapMinMax.ts"

describe("Min Heap - Correctness", () => {
  test("Inserting elements (1)", () => {
    const minH = new MinHeap()

    minH.insert(5)
    minH.insert(2)
    minH.insert(3)
    minH.insert(8)
    minH.insert(9)
    minH.insert(1)
    minH.insert(7)
    minH.insert(4)
    minH.insert(6)

    expect(minH.toString()).toBe("1,4,2,5,9,3,7,8,6")
  })

  test("Inserting elements (2)", () => {
    const minH = new MinHeap()

    minH.insert(3)
    minH.insert(7)
    minH.insert(6)
    minH.insert(9)
    minH.insert(2)
    minH.insert(5)
    minH.insert(10)
    minH.insert(4)
    minH.insert(8)
    minH.insert(1)

    expect(minH.toString()).toBe("1,2,5,4,3,6,10,9,8,7")
  })

  test("Delete min element", () => {
    const minH = new MinHeap()

    minH.insert(1)
    minH.insert(2)
    minH.insert(3)
    minH.insert(4)
    minH.insert(5)
    minH.insert(6)
    minH.insert(7)

    minH.extractMin()

    expect(minH.toString()).toBe("2,4,3,7,5,6")
  })

  test("RemoveKey Index", () => {
    const minH = new MinHeap()

    minH.insert(9)
    minH.insert(8)
    minH.insert(7)
    minH.insert(6)
    minH.insert(5)
    minH.insert(4)
    minH.insert(3)

    minH.removeIndex(3)
  })
})

describe("Max Heap - Correctness", () => {
  test("Inserting elements (1)", () => {
    // 8, 12, 11, 7, 4, 14 und 9

    const mHeap = new MaxHeap()

    mHeap.insert(8)
    mHeap.insert(12)
    mHeap.insert(11)
    mHeap.insert(7)
    mHeap.insert(4)
    mHeap.insert(14)
    mHeap.insert(9)

    expect(mHeap.toString()).toBe("14,8,12,7,4,11,9")
  })

  test("Inserting elements (2)", () => {
    // 7, 12, 6, 11, 15, 1, 2 und 16

    const mHeap = new MaxHeap()

    mHeap.insert(7)
    mHeap.insert(12)
    mHeap.insert(6)
    mHeap.insert(11)
    mHeap.insert(15)
    mHeap.insert(1)
    mHeap.insert(2)
    mHeap.insert(16)

    expect(mHeap.toString()).toBe("16,15,6,12,11,1,2,7")
  })

  test("Inserting elements (3)", () => {
    // 17, 5, 12, 6, 9, 16, 3, 11 und 8

    const mHeap = new MaxHeap()

    mHeap.insert(17)
    mHeap.insert(5)
    mHeap.insert(12)
    mHeap.insert(6)
    mHeap.insert(9)
    mHeap.insert(16)
    mHeap.insert(3)
    mHeap.insert(11)
    mHeap.insert(8)

    expect(mHeap.toString()).toBe("17,11,16,9,6,12,3,5,8")
  })

  test("Build heap 1", () => {
    // 523891746
    const mHeap = new MaxHeap()

    mHeap.build([5, 2, 3, 8, 9, 1, 7, 4, 6])

    expect(mHeap.toString()).toBe("9,8,7,6,2,1,3,4,5")
  })

  test("Build heap 2", () => {
    // 3 7 6 9 2 5 10 4 8 1

    const mHeap = new MaxHeap()

    mHeap.build([3, 7, 6, 9, 2, 5, 10, 4, 8, 1])

    expect(mHeap.toString()).toBe("10,9,6,8,2,5,3,4,7,1")
  })

  test("Build heap 3", () => {
    // 1 5 2 10 8 3 9 7 6 4 11

    const mHeap = new MaxHeap()

    mHeap.build([1, 5, 2, 10, 8, 3, 9, 7, 6, 4, 11])

    expect(mHeap.toString()).toBe("11,10,9,7,8,3,2,1,6,4,5")
  })
})
