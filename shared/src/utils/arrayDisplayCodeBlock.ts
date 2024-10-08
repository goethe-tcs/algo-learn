import { SingleTranslation } from "@shared/utils/translations"

/**
 * This type indicates the props that are needed to display an array in a code block.
 *
 * @param array The array that should be displayed.
 * @param startingIndex The index to in the top row to start with
 *                      (default is 0, mostly either 0 or 1)
 * @param secondRowName The name of the second row (default is ST "Value")
 */
export type ArrayDisplayProps<T> = {
  array: T[]
  startingIndex: number
  secondRowName: SingleTranslation
  inputFieldSize?: number
}

/**
 * This function creates an array display code block with user input fields.
 * @param numberOfInputFields - (more than nine input fields may be too large)
 * @param startingIndex
 * @param secondRowName
 * @param inputFieldSize - the max number of characters necessary to fill the input field
 * @param leadValues - the lead values are values in the columns in front of the input fields
 */
export function createArrayDisplayCodeBlockUserInput({
  numberOfInputFields,
  startingIndex = 0,
  secondRowName = { de: "Wert", en: "Value" },
  inputFieldCharacters = 2,
  leadValues = [],
}: {
  numberOfInputFields: number
  startingIndex?: number
  secondRowName?: SingleTranslation
  inputFieldCharacters?: number
  leadValues?: string[]
}) {
  // create as many input fields as needed
  const inputFields: string[] = leadValues
  for (let i = 0; i < numberOfInputFields; i++) {
    inputFields.push(`{{input-${i}#OS_${inputFieldCharacters.toString()}###overlay}}`)
  }
  return {
    inputFields,
    arrayDisplayBlock: createArrayDisplayCodeBlock({
      array: inputFields,
      startingIndex,
      secondRowName,
    }),
  }
}

/**
 * This function stringifies the array and returns it in a code block.
 * @param array
 * @param startingIndex
 * @param secondRowName
 */
export function createArrayDisplayCodeBlock<T>({
  array,
  startingIndex = 0,
  secondRowName = { de: "Wert", en: "Value" },
}: {
  array: T[]
  startingIndex?: number
  secondRowName?: SingleTranslation
}): string {
  const parseArrayBlock: ArrayDisplayProps<T> = {
    array,
    startingIndex,
    secondRowName,
  }

  return `
\`\`\`array
${JSON.stringify(parseArrayBlock)}
\`\`\`
  `
}
