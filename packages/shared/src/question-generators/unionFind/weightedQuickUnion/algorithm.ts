import { UnionFind } from "@shared/question-generators/unionFind/unionFind.ts"

/**
 * QuickUnion implementation
 */
export class WeightedQuickUnion extends UnionFind {
  constructor(n: number) {
    super(n)
  }

  _find(id: number[], i: number): number {
    this.checkValueRange([i])
    while (i !== id[i]) {
      i = id[i]
    }
    return i
  }

  _union(id: number[], i: number, j: number, sz: number[]): { id: number[]; sz: number[] } {
    this.checkValueRange([i, j])
    const ri = this._find(id, i)
    const rj = this._find(id, j)
    if (ri !== rj) {
      if (sz[ri] <= sz[rj]) {
        id[ri] = rj
        sz[rj] += sz[ri]
      } else {
        id[rj] = ri
        sz[ri] += sz[rj]
      }
    }
    return { id, sz }
  }
}
