/**
 * Parent class for Min and Max Heap
 *
 * @Restriction Only usable with numbers
 *
 */
export abstract class Heap {
  heap: number[] = []

  insert(value: number) {
    this.heap.push(value)
    this.bubbleUp(this.heap.length - 1)
  }

  extract() {
    if (this.heap.length === 0) {
      return null
    }
    const element = this.heap[0]
    const lastElement = this.heap.pop()
    if (lastElement !== undefined) {
      this.heap[0] = lastElement
      this.bubbleDown(0)
    }
    return element
  }

  removeIndex(index: number) {
    if (index >= this.heap.length) {
      return
    }
    const lastElement = this.heap.pop()
    if (lastElement !== undefined) {
      this.heap[index] = lastElement
      this.bubbleDown(index)
    }
  }

  removeValue(value: number) {
    const index = this.search(value)
    if (index !== -1) {
      this.removeIndex(index)
    }
  }

  search(value: number) {
    return this.heap.indexOf(value)
  }

  clear() {
    this.heap = []
  }

  build(newHeap: number[]) {
    this.heap = newHeap
    for (let i = Math.floor(this.heap.length / 2); i >= 0; i--) {
      this.bubbleDown(i)
    }
  }

  getField(i: number) {
    return this.heap[i]
  }

  getSize() {
    return this.heap.length
  }

  getHeap() {
    return this.heap.slice()
  }

  toString() {
    return this.heap.toString()
  }

  abstract bubbleUp(index: number): void
  abstract bubbleDown(index: number): void
}

/**
 * Class for a MinHeap
 *
 * @Restriction Only usable with numbers
 *
 */
export class MinHeap extends Heap {
  heap: number[] = []

  extractMin() {
    this.extract()
  }

  bubbleUp(index: number) {
    while (index > 0) {
      const element = this.heap[index]
      const parentIndex = Math.floor((index - 1) / 2)
      const parent = this.heap[parentIndex]
      if (parent <= element) break
      this.heap[index] = parent
      this.heap[parentIndex] = element
      index = parentIndex
    }
  }

  bubbleDown(index: number) {
    const value = this.heap[index]
    while (index < this.heap.length) {
      const left = 2 * index + 1
      const right = 2 * index + 2
      let smallest = index
      if (left < this.heap.length && this.heap[left] < this.heap[smallest]) {
        smallest = left
      }
      if (right < this.heap.length && this.heap[right] < this.heap[smallest]) {
        smallest = right
      }
      if (smallest === index) break
      this.heap[index] = this.heap[smallest]
      this.heap[smallest] = value
      index = smallest
    }
  }
}

/**
 * Class for a MaxHeap
 *
 * @Restriction Only usable with numbers
 *
 */
export class MaxHeap extends Heap {
  heap: number[] = []

  extractMax() {
    this.extract()
  }

  bubbleUp(index: number) {
    while (index > 0) {
      const element = this.heap[index]
      const parentIndex = Math.floor((index - 1) / 2)
      const parent = this.heap[parentIndex]
      if (parent >= element) break
      this.heap[index] = parent
      this.heap[parentIndex] = element
      index = parentIndex
    }
  }

  bubbleDown(index: number) {
    const value = this.heap[index]
    while (index < this.heap.length) {
      const left = 2 * index + 1
      const right = 2 * index + 2
      let largest = index
      if (left < this.heap.length && this.heap[left] > this.heap[largest]) {
        largest = left
      }
      if (right < this.heap.length && this.heap[right] > this.heap[largest]) {
        largest = right
      }
      if (largest === index) break
      this.heap[index] = this.heap[largest]
      this.heap[largest] = value
      index = largest
    }
  }
}
