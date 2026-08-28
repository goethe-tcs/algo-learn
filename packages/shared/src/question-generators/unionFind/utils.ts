import type { Language } from "@shared/api/Language.ts"
import type { UnionFind } from "@shared/question-generators/unionFind/unionFind.ts"
import { createArrayDisplayCodeBlock } from "@shared/utils/arrayDisplayCodeBlock.ts"
import type Random from "@shared/utils/random.ts"

/**
 * This function performs additional union operations outside the block/blocks
 * @param random - random class object
 * @param union - union object
 * @param unionSize - size of the union
 * @param usedElements - already used elements inside the block
 *                       those will not be used anymore
 * @param otherOperations - how many other operations should be performed
 *                          only till there are enough elements left
 */
function performAdditionalUnionOperation({
  random,
  union,
  unionSize,
  usedElements,
  otherOperations,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  usedElements: number[]
  otherOperations: number
}) {
  while (otherOperations > 0 && unionSize - usedElements.length > 2) {
    const otherValues = random.subset(
      [...Array(unionSize).keys()].filter((value) => !usedElements.includes(value)),
      2,
    )
    union.union(otherValues[0], otherValues[1])
    otherOperations--
    usedElements.push(...otherValues)
  }

  return { union }
}

/**
 * This will find a value outside a block and combine it with a value inside the block
 * @param random - random class object
 * @param union - union object
 * @param blockValues - values of the block where the value should be found
 * @param unionSize - size of the union (this indicates the possible values outside the block)
 * @param lang
 */
function findAndPerformUnionOperation(
  random: Random,
  union: UnionFind,
  blockValues: number[],
  unionSize: number,
  lang: Language,
) {
  const gapField = createArrayDisplayCodeBlock({
    array: union.getArray()[0],
    lang,
  })

  const gapOperationValues: number[] = []
  gapOperationValues[0] = random.choice(blockValues)
  // create an array with values 0 ... unionSize - 1 and filter all blockValues
  gapOperationValues[1] = random.choice(
    [...Array(unionSize).keys()].filter((value) => !blockValues.includes(value)),
  )

  // compute the final union after combining one more element
  union.union(gapOperationValues[0], gapOperationValues[1], true)

  return { gapField, gapOperationValues }
}

/**
 * This function will create two bigger unions
 *
 * It'll return the values of the two unions and the union object
 *
 * @param random
 * @param union
 * @param unionSize
 * @param otherOperation - if true, two other random values will also be united
 */
function generateTwoBlocks({
  random,
  union,
  unionSize,
  otherOperation = true,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  otherOperation?: true | false
}) {
  // Determine sizes for two blocks within the union, ensuring they are within bounds
  const block1Size = random.int(Math.min(2, unionSize / 2 - 1), unionSize / 2 - 1)
  const block2Size = random.int(2, unionSize / 2 - 1)

  // Select unique values for each block from the union
  const valueOptions: number[] = random.subset([...Array(unionSize).keys()], block1Size + block2Size)
  const block1Values: number[] = valueOptions.slice(0, block1Size)
  const block2Values: number[] = valueOptions.slice(block1Size)

  // Form unions within each block
  block1Values.forEach((value) => {
    union.union(value, block1Values[0])
  })
  block2Values.forEach((value) => {
    union.union(value, block2Values[0])
  })

  // Optionally, perform an additional union operation outside the two blocks
  const shouldPerformOtherOperation =
    otherOperation && unionSize - block1Values.length - block2Values.length >= 2 && random.bool(0.7)

  if (shouldPerformOtherOperation) {
    const usedElements = [...block1Values, ...block2Values]
    const { union: union_ } = performAdditionalUnionOperation({
      random,
      union,
      unionSize,
      usedElements,
      otherOperations: 1,
    })
    union = union_
  }

  return { block1Values, block2Values, union }
}

/**
 * Only generates one big block
 *
 * @param random
 * @param union
 * @param unionSize
 * @param otherOperation - if 0 --> no other operation
 *                         if 1 --> one other operation (no elements inside big union are used)
 *                         if 2 --> two other operations (no elements inside big union are used and not from the
 *                                                        previous operation)
 *                         if x --> perform until x reached, or it's not possible anymore
 */
function generateOneBlock({
  random,
  union,
  unionSize,
  otherOperations = 1,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  otherOperations?: number
}) {
  const usedElements: number[] = []

  let block1Size: number
  try {
    block1Size = random.intNormal(3, unionSize - 2, (unionSize - 2) / 2 + 1, 1.5)
  } catch {
    block1Size = (unionSize - 2) / 2 + 1
  }

  const block1Values: number[] = random.subset([...Array(unionSize).keys()], block1Size)
  usedElements.push(...block1Values)

  block1Values.forEach((value) => {
    union.union(value, block1Values[0])
  })

  const { union: union_ } = performAdditionalUnionOperation({
    random,
    union,
    unionSize,
    usedElements,
    otherOperations,
  })
  union = union_

  return { block1Values, union }
}

/**
 * This will generate a question with two bigger unions
 * And as next operation to combine one element inside one of the blocks
 * with one element outside the blocks
 * @param random - random class object
 * @param union - union object
 * @param unionSize - size of the union
 * @param lang
 */
export function unionTwoBlocksCombineOne({
  random,
  union,
  unionSize,
  lang,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  lang: Language
}) {
  const { block1Values, union: updatedUnion } = generateTwoBlocks({
    random,
    union,
    unionSize,
  })

  return findAndPerformUnionOperation(random, updatedUnion, block1Values, unionSize, lang)
}

/**
 * Generates two bigger unions
 * And as the next operation, combine the two elements inside neither of those
 *
 * @param random
 * @param union
 * @param unionSize
 * @param lang
 */
export function unionTwoBlocksCombineNone({
  random,
  union,
  unionSize,
  lang,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  lang: Language
}) {
  let block1Values: number[] = []
  let block2Values: number[] = []

  do {
    ;({ block1Values, block2Values, union } = generateTwoBlocks({
      random,
      union,
      unionSize,
      otherOperation: false,
    }))
  } while (block1Values.length + block2Values.length >= unionSize - 1)
  // The loop ensures there's at least one element outside the two blocks

  const gapField = createArrayDisplayCodeBlock({
    array: union.getArray()[0],
    lang,
  })

  // Select two values not in block1Values or block2Values
  const gapOperationValues = random.subset(
    [...Array(unionSize).keys()].filter(
      (value) => !block1Values.includes(value) && !block2Values.includes(value),
    ),
    2,
  )

  // Perform the final union operation
  union.union(gapOperationValues[0], gapOperationValues[1], true)

  return { gapField, gapOperationValues }
}

/**
 * This just creates twoBlocks
 * Next operation is to combine two elements inside the same block
 * @param random
 * @param union
 * @param unionSize
 * @param lang
 */
export function unionTwoBlocksCombineSame({
  random,
  union,
  unionSize,
  lang,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  lang: Language
}) {
  const { block1Values, union: union_ } = generateTwoBlocks({ random, union, unionSize })
  union = union_

  const gapField = createArrayDisplayCodeBlock({
    array: union.getArray()[0],
    lang,
  })

  const gapOperationValues: number[] = random.subset(block1Values, 2)

  // compute the final union
  union.union(gapOperationValues[0], gapOperationValues[1], true)

  return {
    gapField,
    gapOperationValues,
  }
}

/**
 * This will generate a question with one big block
 * And as next operation to combine one element inside the block
 * with one element outside the block
 * @param random - random class object
 * @param union - union object
 * @param unionSize - size of the union
 * @param lang
 */
export function unionOneBlockCombineOne({
  random,
  union,
  unionSize,
  lang,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  lang: Language
}) {
  const { block1Values, union: updatedUnion } = generateOneBlock({
    random,
    union,
    unionSize,
    otherOperations: random.int(0, 2), // if any other operation should be performed
  })

  return findAndPerformUnionOperation(random, updatedUnion, block1Values, unionSize, lang)
}

/**
 * This just creates one big block
 * And as next operation to combine two elements outside the big union
 *
 * @param random
 * @param union
 * @param unionSize
 * @param lang
 */
export function unionOneBlockCombineNone({
  random,
  union,
  unionSize,
  lang,
}: {
  random: Random
  union: UnionFind
  unionSize: number
  lang: Language
}) {
  const { block1Values, union: union_ } = generateOneBlock({
    random,
    union,
    unionSize,
    otherOperations: 10,
  })
  union = union_

  const gapField = createArrayDisplayCodeBlock({
    array: union.getArray()[0],
    lang,
  })

  const gapOperationValues: number[] = random.subset(
    [...Array(unionSize).keys()].filter((value) => !block1Values.includes(value)),
    2,
  )

  // compute the final union
  union.union(gapOperationValues[0], gapOperationValues[1], true)

  return {
    gapField,
    gapOperationValues,
  }
}
