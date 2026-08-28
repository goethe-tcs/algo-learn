import type { Language } from "@shared/api/Language.ts"
import type { UnionFind } from "@shared/question-generators/unionFind/unionFind.ts"
import { createArrayDisplayCodeBlock } from "@shared/utils/arrayDisplayCodeBlock.ts"
import type Random from "@shared/utils/random.ts"

/**
 * Creates artificial states for union find.
 * It ensures that the computed next union operation will perform a path compression.
 *
 * It has different variants to create the states:
 * - OnePath: It is one long path and combines a value from the bottom of the path
 *            with another value not inside the path
 * - TwoPath: It creates two independent paths and combines two bottom values with each
 * - TwoPathTree: Creates two paths which start at the same node.
 *                Asks to combine two bottom values.
 *
 * @param random
 * @param union
 * @param lang
 */
export function createChainedUnionState({
  random,
  union,
  lang,
}: {
  random: Random
  union: UnionFind
  lang: Language
}): {
  gapField: string
  gapOperationValues: number[]
} {
  return random.choice([createTwoPathTree, createTwoPath, createOnePath])({ random, union, lang })
}

/**
 * Creates two paths which start at the same node (so a tree)
 * Asks the user to combine values from the bottom of both paths
 *
 * @param random
 * @param union
 * @param lang
 */
function createTwoPathTree({
  random,
  union,
  lang,
}: {
  random: Random
  union: UnionFind
  lang: Language
}) {
  const unionSize = union.getSize()
  const workingUnion = union.getArray()[0].map((x) => x)

  const firstPathLength = random.int(2, Math.floor(unionSize / 2) - 1)
  const secondPathLength = random.int(2, Math.floor(unionSize / 2) - 1)

  const firstPathValues = random.subset(workingUnion, firstPathLength)
  const secondPathValues = random.subset(
    workingUnion.filter((x) => !firstPathValues.includes(x)),
    secondPathLength,
  )
  const combinedStartNode = random.choice(
    workingUnion.filter((x) => !firstPathValues.includes(x) && !secondPathValues.includes(x)),
  )
  firstPathValues.push(combinedStartNode)
  secondPathValues.push(combinedStartNode)

  for (let i = 0; i < firstPathLength; i++) {
    workingUnion[firstPathValues[i]] = workingUnion[firstPathValues[i + 1]]
  }
  for (let i = 0; i < secondPathLength; i++) {
    workingUnion[secondPathValues[i]] = workingUnion[secondPathValues[i + 1]]
  }

  const gapOperationValues: number[] = []
  gapOperationValues.push(random.choice(firstPathValues.slice(0, firstPathLength - 1)))
  gapOperationValues.push(random.choice(secondPathValues.slice(0, secondPathLength - 1)))
  random.shuffle(gapOperationValues)

  union.setStateArtificially(workingUnion, true)

  const gapField = createArrayDisplayCodeBlock({
    array: workingUnion,
    lang,
  })

  union.union(gapOperationValues[0], gapOperationValues[1])

  return { gapField, gapOperationValues }
}

/**
 * Creates a union with two paths which start at different nodes
 * Asks to combine two nodes from the bottom of each path
 * @param random
 * @param union
 * @param lang
 */
function createTwoPath({ random, union, lang }: { random: Random; union: UnionFind; lang: Language }) {
  const unionSize = union.getSize()
  const workingUnion = union.getArray()[0].map((x) => x)

  const firstPathLength = random.int(3, 4)
  const secondPathLength = random.int(3, unionSize - firstPathLength)

  const firstPathValues = random.subset(workingUnion, firstPathLength)
  const secondPathValues = random.subset(
    workingUnion.filter((x) => !firstPathValues.includes(x)),
    secondPathLength,
  )

  for (let i = 0; i < firstPathLength - 1; i++) {
    workingUnion[firstPathValues[i]] = workingUnion[firstPathValues[i + 1]]
  }

  for (let i = 0; i < secondPathLength - 1; i++) {
    workingUnion[secondPathValues[i]] = workingUnion[secondPathValues[i + 1]]
  }

  const gapOperationValues: number[] = []
  gapOperationValues.push(random.choice(firstPathValues.slice(0, firstPathLength - 2)))
  gapOperationValues.push(random.choice(secondPathValues.slice(0, secondPathLength - 2)))
  random.shuffle(gapOperationValues)

  union.setStateArtificially(workingUnion, true)

  const gapField = createArrayDisplayCodeBlock({
    array: workingUnion,
    lang,
  })

  union.union(gapOperationValues[0], gapOperationValues[1])

  return { gapField, gapOperationValues }
}

/**
 * Creates one long path and ask to combine a value from the bottom of the path
 * with a value not inside the path
 * @param random
 * @param union
 * @param lang
 */
function createOnePath({ random, union, lang }: { random: Random; union: UnionFind; lang: Language }) {
  const unionSize = union.getSize()
  const workingUnion = union.getArray()[0].map((x) => x)

  const pathLength = random.int(3, unionSize - 2)
  const pathValues = random.subset(workingUnion, pathLength)

  for (let i = 0; i < pathLength - 1; i++) {
    workingUnion[pathValues[i]] = workingUnion[pathValues[i + 1]]
  }
  const gapOperationValues: number[] = []
  gapOperationValues.push(random.choice(workingUnion.filter((x) => !pathValues.includes(x))))
  gapOperationValues.push(random.choice(pathValues.slice(0, pathLength - 2)))
  random.shuffle(gapOperationValues)

  union.setStateArtificially(workingUnion, true)

  const gapField = createArrayDisplayCodeBlock({
    array: workingUnion,
    lang,
  })

  union.union(gapOperationValues[0], gapOperationValues[1])

  return { gapField, gapOperationValues }
}
