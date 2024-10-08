import { MaxHeap, MinHeap } from "@shared/question-generators/heap/heapMinMax.ts"
import Random from "@shared/utils/random.ts"

/**
 * Generates a random unique list of numbers for heap operations foundation
 * and initializes the solution heap
 * @param random
 */
export function generateHeapOperationsFoundation({ random }: { random: Random }) {
  const heapType: "Max" | "Min" = random.choice(["Max", "Min"])
  const heapSize: number = random.int(5, 8)
  const heapElements: number[] = []
  const uniqueElements = new Set<number>()

  while (uniqueElements.size < heapSize) {
    const randomNumber = random.int(1, 20)
    if (!uniqueElements.has(randomNumber)) {
      uniqueElements.add(randomNumber)
      heapElements.push(randomNumber)
    }
  }

  let solutionHeap: MaxHeap | MinHeap
  if (heapType === "Min") {
    solutionHeap = new MinHeap()
  } else {
    solutionHeap = new MaxHeap()
  }

  return {
    heapType,
    heapElements,
    solutionHeap,
  }
}
