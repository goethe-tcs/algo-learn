import { describe, expect, test } from "vitest"
import { QuickFind } from "./quickFind/quickFindAlgorithm"

describe("UnionFind via QuickFind", () => {
  test("Test union operation", () => {
    const uf = new QuickFind(10)

    uf.union(1, 2)
    expect(uf.find(1)).toEqual(uf.find(2))

    uf.union(3, 4)
    expect(uf.find(3)).toEqual(uf.find(4))

    expect(uf.find(1)).not.toEqual(uf.find(3))

    uf.union(2, 3)
    expect(uf.find(1)).toEqual(uf.find(3))
  })
})
