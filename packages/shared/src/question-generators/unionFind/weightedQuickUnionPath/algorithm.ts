import { WeightedQuickUnion } from "@shared/question-generators/unionFind/weightedQuickUnion/algorithm.ts"

/**
 * QuickUnion implementation
 */
export class WeightedQuickUnionPath extends WeightedQuickUnion {
  constructor(n: number) {
    super(n)
  }

  _find(id: number[], i: number): number {
    this.checkValueRange([i])
    if (i !== id[i]) {
      id[i] = this._find(id, id[i])
    }
    return id[i]
  }
}
