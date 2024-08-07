export class QuickFind {
  private readonly id: number[]

  constructor(n: number) {
    this.id = new Array(n) as number[]
    for (let i = 0; i < n; i++) {
      this.id[i] = i
    }
  }

  find(i: number) {
    return this.id[i]
  }

  union(i: number, j: number) {
    const pid = this.id[i]
    const qid = this.id[j]
    if (pid !== qid) {
      for (let i = 0; i < this.id.length; i++) {
        if (this.id[i] === pid) {
          this.id[i] = qid
        }
      }
    }
  }

  /**
   * This function returns the current union array field as a copy
   */
  getArray() {
    // only provide a copy
    return this.id.slice()
  }
}
