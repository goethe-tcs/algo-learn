/**
 * Abstract class for all UnionFind data structure implementations
 */
export abstract class UnionFind {
  protected idList: number[][]
  protected szList: number[][]

  protected constructor(n: number) {
    this.idList = [Array.from({ length: n }, (_, i) => i)]
    this.szList = [Array.from({ length: n }).fill(1) as number[]]
  }

  protected abstract _find(id: number[], i: number): number
  protected abstract _union(
    id: number[],
    i: number,
    j: number,
    sz: number[],
  ): { id: number[]; sz: number[] }

  /**
   * Returns find(i) on all current states of the union structure
   * @param i
   */
  find(i: number): number[] {
    this.checkValueRange([i])
    const values: number[] = []
    for (let k = 0; k < this.idList.length; k++) {
      values.push(this._find(this.idList[k], i))
    }
    return values
  }

  /**
   * Performs the union operation on each currently existing union.
   * @param i
   * @param j
   * @param eitherDirection - if it doesn't matter if find(i) -> find(j) or find(j) -> find(i)
   *                          and both states should be computed and stored.
   */
  union(i: number, j: number, eitherDirection: boolean = false) {
    this.checkValueRange([i, j])
    const newIDs: number[][] = []
    const newSZs: number[][] = []
    for (let k = 0; k < this.idList.length; k++) {
      if (eitherDirection) {
        const copyID = this.idList[k].map((x) => x)
        const copySZ = this.szList[k].map((x) => x)
        const unionResult = this._union(copyID, j, i, copySZ)
        newIDs.push(unionResult.id)
        newSZs.push(unionResult.id)
      }
      const unionResult = this._union(this.idList[k], i, j, this.szList[k])
      this.idList[k] = unionResult.id
      this.szList[k] = unionResult.sz
    }
    this.idList.push(...newIDs)
    this.szList.push(...newSZs)
    this.filterUniques()
  }

  /**
   * This function returns the current union array field as a copy
   */
  getArray(): number[][] {
    return this.idList
  }

  /**
   * Checks if each index is within the compatible range [0, len(id)-1]
   * @param indices
   */
  checkValueRange(indices: number[]) {
    for (const i of indices) {
      if (i < 0 || i > this.idList[0].length - 1) {
        throw new Error("Values have to be in the union size range.")
      }
    }
  }

  /**
   * Returns the size of each union
   */
  getSize(): number {
    return this.idList[0].length
  }

  /**
   * Returns the current amount of different union states
   */
  getUnionAmount(): number {
    return this.idList.length
  }

  getSzList(): number[][] {
    return this.szList
  }

  /**
   * Adds a union find state to the data structure
   * @param state - the new (artificially created state)
   * @param reset - if the current states should be clear or if the new state should be added
   */
  setStateArtificially(state: number[], reset: boolean = true) {
    if (reset) {
      if (state.some((x) => x < 0 || x >= state.length)) {
        throw new Error("Values inside union state have to be within [0...length-1]")
      }
      this.idList = [state]
      this.szList = [this.computeSizes(state)]
    } else {
      if (state.length !== this.idList[0].length || state.some((x) => x < 0 || x >= state.length)) {
        throw new Error(
          "By adding an artificially state to the union states, this state has to be of the same size as the other states and has to include only values from [0...length-1].",
        )
      }
      this.idList.push(state)
      this.szList.push(this.computeSizes(state))
    }
  }

  /**
   * Given an id - array, it computes a corresponding size array (for weighted quick union (path compression))
   * Doesn't use _find, so the id array will not change during execution
   * @param id
   * @private
   */
  private computeSizes(id: number[]): number[] {
    const sz = Array.from({ length: id.length }).fill(1) as number[]
    for (let i = 0; i < id.length; i++) {
      let helpI = i
      while (id[helpI] !== helpI) {
        helpI = id[helpI]
        sz[helpI] += 1
      }
    }
    return sz
  }

  /**
   * Filters out union states which are the same
   * @private
   */
  private filterUniques(): void {
    const uniqueIDs: number[][] = []
    const uniqueSZs: number[][] = []
    const itemsFound: { [key: string]: boolean } = {}
    for (let i = 0, l = this.idList.length; i < l; i++) {
      const stringified = JSON.stringify(this.idList[i])
      if (itemsFound[stringified]) {
        continue
      }
      uniqueIDs.push(this.idList[i])
      uniqueSZs.push(this.szList[i])
      itemsFound[stringified] = true
    }
    this.idList = uniqueIDs
    this.szList = uniqueSZs
  }
}
