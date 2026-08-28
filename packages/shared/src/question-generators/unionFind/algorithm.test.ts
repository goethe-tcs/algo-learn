import { describe, expect, test } from "vitest"
import { QuickUnion } from "@shared/question-generators/unionFind/quickUnion/algorithm.ts"
import { WeightedQuickUnion } from "@shared/question-generators/unionFind/weightedQuickUnion/algorithm.ts"
import { WeightedQuickUnionPath } from "@shared/question-generators/unionFind/weightedQuickUnionPath/algorithm.ts"
import { QuickFind } from "./quickFind/algorithm.ts"

describe("UnionFind via QuickFind", () => {
  test("Test union operation", () => {
    const uf = new QuickFind(10)

    uf.union(1, 2, true)
    expect(uf.getArray()).toContainEqual([0, 1, 1, 3, 4, 5, 6, 7, 8, 9])
    uf.union(3, 4, true)
    expect(uf.getArray()).toContainEqual([0, 1, 1, 4, 4, 5, 6, 7, 8, 9])
    uf.union(1, 4, true)

    const expectedArrays = [
      [4, 4, 4, 4],
      [1, 1, 1, 1],
      [3, 3, 3, 3],
      [2, 2, 2, 2],
    ].map((values) => [0, ...values, 5, 6, 7, 8, 9])
    expectedArrays.forEach((expected) => {
      expect(uf.getArray()).toContainEqual(expected)
    })
  })
})

describe("UnionFind via QuickUnion", () => {
  test("Test union operation", () => {
    const quickUnion = new QuickUnion(7)

    quickUnion.union(3, 4, true)
    expect(quickUnion.getArray()).toContainEqual([0, 1, 2, 4, 4, 5, 6])

    quickUnion.union(5, 0, true)
    expect(quickUnion.getArray()).toContainEqual([0, 1, 2, 4, 4, 0, 6])

    quickUnion.union(4, 5, true)
    expect(quickUnion.getArray()).toContainEqual([0, 1, 2, 4, 0, 0, 6])

    quickUnion.union(4, 3, true)
    expect(quickUnion.getArray()).toContainEqual([0, 1, 2, 4, 0, 0, 6])

    quickUnion.union(0, 1, true)
    expect(quickUnion.getArray()).toContainEqual([1, 1, 2, 4, 0, 0, 6])

    quickUnion.union(2, 6, true)
    expect(quickUnion.getArray()).toContainEqual([1, 1, 6, 4, 0, 0, 6])

    quickUnion.union(0, 4, true)
    expect(quickUnion.getArray()).toContainEqual([1, 1, 6, 4, 0, 0, 6])

    quickUnion.union(6, 0, true)
    expect(quickUnion.getArray()).toContainEqual([1, 1, 6, 4, 0, 0, 1])
  })
})

describe("UnionFind via Weighted QuickUnion", () => {
  test("Test union operation", () => {
    const weightedQuickUnion = new WeightedQuickUnion(7)

    weightedQuickUnion.union(3, 4)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 1, 2, 4, 4, 5, 6])

    weightedQuickUnion.union(5, 0)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 1, 2, 4, 4, 0, 6])

    weightedQuickUnion.union(4, 5)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 1, 2, 4, 0, 0, 6])

    weightedQuickUnion.union(4, 3)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 1, 2, 4, 0, 0, 6])

    weightedQuickUnion.union(0, 1)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 0, 2, 4, 0, 0, 6])

    weightedQuickUnion.union(2, 6)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 0, 6, 4, 0, 0, 6])

    weightedQuickUnion.union(0, 4)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 0, 6, 4, 0, 0, 6])

    weightedQuickUnion.union(6, 0)
    expect(weightedQuickUnion.getArray()).toContainEqual([0, 0, 6, 4, 0, 0, 0])
  })
})

describe("UnionFind via Weighted QuickUnion with path compression", () => {
  test("Test union operation", () => {
    const weightedQuickUnionPath = new WeightedQuickUnionPath(7)

    weightedQuickUnionPath.union(3, 4)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 1, 2, 4, 4, 5, 6])

    weightedQuickUnionPath.union(5, 0)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 1, 2, 4, 4, 0, 6])

    weightedQuickUnionPath.union(4, 5)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 1, 2, 4, 0, 0, 6])

    weightedQuickUnionPath.union(4, 3)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 1, 2, 0, 0, 0, 6])

    weightedQuickUnionPath.union(0, 1)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 0, 2, 0, 0, 0, 6])

    weightedQuickUnionPath.union(2, 6)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 0, 6, 0, 0, 0, 6])

    weightedQuickUnionPath.union(0, 4)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 0, 6, 0, 0, 0, 6])

    weightedQuickUnionPath.union(6, 0)
    expect(weightedQuickUnionPath.getArray()).toContainEqual([0, 0, 6, 0, 0, 0, 0])
  })
})

describe("Union Find - Set artificial union", () => {
  test("Set artificial", () => {
    const union = new WeightedQuickUnion(15)
    union.setStateArtificially([0, 1, 1, 2, 2, 4, 6, 6, 7, 9, 9, 10, 10, 12, 12], true)
    expect(union.find(13)[0]).toEqual(9)
    expect(union.getSzList()[0]).toEqual([1, 5, 4, 1, 2, 1, 3, 2, 1, 6, 5, 1, 3, 1, 1])
  })

  test("Set artificial - Path Compression", () => {
    const union = new WeightedQuickUnionPath(1)
    union.setStateArtificially([0, 1, 3, 7, 2, 3, 4, 7, 8, 8, 12, 10, 7, 11], true)
    expect(union.getSzList()[0]).toEqual([1, 1, 3, 5, 2, 1, 1, 10, 2, 1, 3, 2, 4, 1])
    expect(union.find(13)[0]).toEqual(7)
    expect(union.getArray()[0]).toEqual([0, 1, 3, 7, 2, 3, 4, 7, 8, 8, 7, 7, 7, 7])
  })

  test("Set artificial - throws dimension error", () => {
    const union = new WeightedQuickUnionPath(1)
    expect(() => union.setStateArtificially([0, 1], false)).toThrowError()
  })

  test("Set artificial - throws value error", () => {
    const union = new WeightedQuickUnionPath(2)
    expect(() => union.setStateArtificially([0, 3], true)).toThrowError()
  })
})
