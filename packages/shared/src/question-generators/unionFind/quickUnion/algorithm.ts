import { UnionFind } from "@shared/question-generators/unionFind/unionFind.ts"

/**
 * QuickUnion implementation
 */
export class QuickUnion extends UnionFind {
  constructor(n: number) {
    super(n)
  }

  _find(id: number[], i: number) {
    while (i !== id[i]) {
      i = id[i]
    }
    return i
  }

  _union(id: number[], i: number, j: number): { id: number[]; sz: number[] } {
    const ri = this._find(id, i)
    const rj = this._find(id, j)
    if (ri !== rj) {
      id[ri] = rj
    }
    return { id, sz: [] }
  }
}
