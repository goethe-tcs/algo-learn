import { MaxHeap, MinHeap } from "@shared/question-generators/heap/heapMinMax.ts"
import { createArrayDisplayCodeBlock } from "@shared/utils/arrayDisplayCodeBlock.ts"
import Random from "@shared/utils/random.ts"

/**
 * Generates a random operations sequence for heap operations combine variation
 *
 * Sample:
 *  7,3,2,4,2,*,*,4,*
 * A number means, inserting this number into the heap and * for extracting min or max
 *
 * @param heapType
 * @param random
 */
export function generateOperationSequence(
  heapType: "Min" | "Max",
  random: Random,
): { sequence: string; heap: MinHeap | MaxHeap } {
  const sequenceLength = random.int(6, 9)
  const heap = heapType === "Min" ? new MinHeap() : new MaxHeap()
  const usedValues = new Set<number>()

  let amountInserts = 0
  let amountExtracts = 0

  const operationSequence = []

  for (let i = 0; i < sequenceLength; i++) {
    const canExtract = amountInserts - amountExtracts >= 2
    let operation: "insert" | "extract" = canExtract
      ? random.weightedChoice([
          ["insert", 0.6],
          ["extract", 0.4],
        ])
      : "insert"

    // include at least one extract operation
    if (i === sequenceLength - 1 && amountExtracts === 0) operation = "extract"

    if (operation === "insert") {
      let newValue = random.int(1, 20)
      while (usedValues.has(newValue)) {
        newValue = random.int(1, 20)
      }
      usedValues.add(newValue)
      operationSequence.push(newValue.toString())
      heap.insert(newValue)
      amountInserts++
    } else {
      operationSequence.push("*")
      if (heap instanceof MinHeap) {
        heap.extractMin()
      } else {
        heap.extractMax()
      }
      amountExtracts++
    }
  }

  return { sequence: operationSequence.join(", "), heap }
}

/**
 * Generates a random question part, to test the understanding about (where children and parents are inside a heap)
 * @param random
 */
export function generateNeighbourOptions(random: Random) {
  const neighbourOption: "parent" | "leftChild" | "rightChild" = random.choice([
    "parent",
    "leftChild",
    "rightChild",
  ])

  const neighbourMap = {
    parent: {
      formula: (index: number) => Math.floor(index / 2),
      text: ["parent"],
    },
    leftChild: {
      formula: (index: number) => index * 2,
      text: ["leftChild"],
    },
    rightChild: {
      formula: (index: number) => index * 2 + 1,
      text: ["rightChild"],
    },
  }

  return {
    formula: neighbourMap[neighbourOption].formula,
    text: neighbourMap[neighbourOption].text,
  }
}

/**
 * Generates random correct and wrong heaps for the heap verifying question
 * Also the solution index will be generated
 * @param heapType
 * @param random
 */
export function generateHeapsForChoiceQuestion(
  heapType: "Max" | "Min",
  random: Random,
): { heapStringTable: string[]; correctAnswerIndex: number[] } {
  const wrongRandomHeaps = generateRandomWrongHeaps(heapType, random)

  const amountOfCorrectHeaps = random.int(
    4 - wrongRandomHeaps.length > 0 ? 4 - wrongRandomHeaps.length : 1,
    4,
  )

  const correctRandomHeaps = generateRandomHeaps(heapType, amountOfCorrectHeaps, random)
  const correctRandomHeapsString = correctRandomHeaps.map((heap) =>
    createArrayDisplayCodeBlock({
      array: ["-"].concat(heap.getHeap().map(String)),
    }),
  )

  const wrongRandomHeapsString = random.subset(
    wrongRandomHeaps.map((heap) =>
      createArrayDisplayCodeBlock({
        array: ["-"].concat(heap.map(String)),
      }),
    ),
    4 - correctRandomHeaps.length,
  )

  const heapStringTable = random.shuffle(correctRandomHeapsString.concat(wrongRandomHeapsString))
  const correctAnswerIndex = correctRandomHeapsString.map((heapString) =>
    heapStringTable.indexOf(heapString),
  )

  return {
    heapStringTable,
    correctAnswerIndex,
  }
}

/**
 * Generates $n$ random heaps (either Min or MaxHeaps)
 * @param heapType
 * @param count
 * @param random
 */
export function generateRandomHeaps(
  heapType: "Max" | "Min",
  count: number,
  random: Random,
): (MaxHeap | MinHeap)[] {
  const heaps: (MaxHeap | MinHeap)[] = []
  const heapSet: Set<string> = new Set()

  while (heaps.length < count) {
    const heap = heapType === "Max" ? new MaxHeap() : new MinHeap()
    const size = random.int(6, 9)
    for (let j = 0; j < size; j++) {
      heap.insert(random.int(1, 20))
    }

    const heapString = heap.toString()
    if (!heapSet.has(heapString)) {
      heapSet.add(heapString)
      heaps.push(heap)
    }
  }

  return heaps
}

/**
 * This function generates a set of wrong heaps (as number[][]) for the heap understanding question
 * Currently only four different variations how wrong heaps are generated
 * @param heapType
 * @param random
 */
export function generateRandomWrongHeaps(heapType: "Max" | "Min", random: Random): number[][] {
  const heaps: number[][] = []

  const heap1 = generateRandomHeaps(heapType === "Min" ? "Max" : "Min", 1, random)[0]
  // very unlikely that this will result in a correct heap, but it could
  if (checkCorrectHeap(heap1.getHeap(), heapType)) {
    heaps.push(heap1.getHeap())
  }

  const heap2 = generateRandomHeaps(heapType, 1, random)[0].getHeap()
  const wrongHeap2 = swapParentChild(heap2, random)
  // this could still result in a correct heap
  if (!checkCorrectHeap(wrongHeap2, heapType)) {
    heaps.push(wrongHeap2)
  }

  const heap3 = generateRandomHeaps(heapType, 1, random)[0].getHeap()
  const wrongHeap3 = replaceValueWithNaN(heap3, random)
  heaps.push(wrongHeap3)

  const heap4 = generateRandomHeaps(heapType, 1, random)[0].getHeap()
  const wrongHeap4 = changeChildValue(heap4, heapType, random)
  if (!checkCorrectHeap(wrongHeap4, heapType)) {
    heaps.push(wrongHeap4)
  }

  return heaps
}

/**
 * This function swaps a parent with its corresponding child in a heap
 * @param heap - the heap to swap parent with child
 * @param random - random class object
 */
export function swapParentChild(heap: number[], random: Random): number[] {
  const newHeap = [...heap]
  const index = random.int(1, newHeap.length - 1)
  let neighbour = -1
  do {
    neighbour = random.choice([index * 2 + 1, index * 2 + 2, Math.floor((index - 1) / 2)])
  } while (neighbour < 0 || neighbour >= newHeap.length)
  ;[newHeap[index], newHeap[neighbour]] = [newHeap[neighbour], newHeap[index]]
  return newHeap
}

/**
 * This function replaces a random leaf node with NaN
 * @param heap - the heap to replace a leaf node with NaN
 * @param random - random class object
 */
export function replaceValueWithNaN(heap: number[], random: Random): number[] {
  const newHeap = [...heap]
  // replace a random leaf node with NaN
  const index = random.int(Math.floor(newHeap.length / 2), newHeap.length)
  if (index < newHeap.length) {
    newHeap[index] = Number.NaN
  } else {
    newHeap.push(Number.NaN)
  }
  return newHeap
}

/**
 * This function increases/decreases the value of a child node in a heap
 * @param heap - the heap to increase/decreases the value of a child node
 * @param heapType - the type of heap (either Min or Max)
 * @param random - random class object
 */
export function changeChildValue(heap: number[], heapType: "Min" | "Max", random: Random): number[] {
  const newHeap = [...heap]
  const child = random.int(1, newHeap.length - 1)
  const parent = Math.floor((child - 1) / 2)
  const diffValue = random.int(1, 3)
  newHeap[child] = newHeap[parent] + (heapType === "Min" ? -1 : 1) * diffValue
  return newHeap
}

/**
 * Checks if a number array is a correct heap
 * @param heap
 * @param type need to provide if either "Max" or "Min" heap to check
 */
export function checkCorrectHeap(heap: number[], type: "Max" | "Min"): boolean {
  // check if every child is smaller than its parent
  for (let i = 1; i < heap.length; i++) {
    const parent = Math.floor((i - 1) / 2)
    if (type === "Max" && heap[parent] < heap[i]) {
      return false
    } else if (type === "Min" && heap[parent] > heap[i]) {
      return false
    }
  }
  return true
}
