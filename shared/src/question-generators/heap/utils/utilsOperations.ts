import { MaxHeap, MinHeap } from "@shared/question-generators/heap/heapMinMax.ts"
import Random from "@shared/utils/random.ts"

export function generateHeapOperationsFoundation({ random }: { random: Random }) {
  const heapType: "Max" | "Min" = random.choice(["Max", "Min"])
  const heapSize: number = random.int(5, 9)
  const heapElements: number[] = []
  for (let i = 0; i < heapSize; i++) {
    heapElements.push(random.int(1, 20))
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
