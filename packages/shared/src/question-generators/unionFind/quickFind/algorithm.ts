import { UnionFind } from "@shared/question-generators/unionFind/unionFind.ts"

/**
 * Quick Find implementation
 */
export class QuickFind extends UnionFind {
  constructor(n: number) {
    super(n)
  }

  _find(id: number[], i: number): number {
    return id[i]
  }

  _union(id: number[], i: number, j: number): { id: number[]; sz: number[] } {
    const pid = id[i]
    const qid = id[j]
    if (pid !== qid) {
      for (let i = 0; i < id.length; i++) {
        if (id[i] === pid) {
          id[i] = qid
        }
      }
    }
    return { id, sz: [] }
  }
}
