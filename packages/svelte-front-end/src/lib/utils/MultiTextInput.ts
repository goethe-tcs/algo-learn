import { inputRegex } from "@shared/utils/parseMarkdown.ts"
import type { FeedbackVariation } from "../components/types"

/**
 * Extracts the input fields from the text.
 * @param text The text to extract the input fields from
 *             Likely to be question.text
 */
export function getInputFields(text: string): {
  inputIds: string[]
  inputTypes: string[]
  inputPrompts: string[]
  inputPlaceholders: string[]
  inputFeedbackVariations: FeedbackVariation[]
} {
  // add the g flag, because String.prototype.matchAll argument must not be a non-global regular expression
  const regex = new RegExp(inputRegex.source, "g")

  const matches = Array.from(text.matchAll(regex))

  const inputFields: string[] = []

  if (matches.length === 0) {
    return {
      inputIds: [],
      inputTypes: [],
      inputPrompts: [],
      inputPlaceholders: [],
      inputFeedbackVariations: [],
    }
  }

  for (let i = 0; i < matches.length; i++) {
    inputFields.push(matches[i][1])
  }

  return getInputFieldValues(inputFields)
}

/**
 * Extracts the values from the input fields.
 * @param inputFields
 */
export function getInputFieldValues(inputFields: string[]): {
  inputIds: string[]
  inputTypes: string[]
  inputPrompts: string[]
  inputPlaceholders: string[]
  inputFeedbackVariations: FeedbackVariation[]
} {
  const inputIds: string[] = []
  const inputTypes: string[] = []
  const inputPrompts: string[] = []
  const inputPlaceholders: string[] = []
  const inputFeedbackVariations: FeedbackVariation[] = []

  for (const inputField of inputFields) {
    const inputFieldSplit = inputField.split("#")
    inputIds.push(inputFieldSplit[0])
    inputTypes.push(inputFieldSplit[1])
    inputPrompts.push(inputFieldSplit[2])
    inputPlaceholders.push(inputFieldSplit[3])
    inputFeedbackVariations.push("overlay") // todo remove inputFeedbackVariation
  }

  return { inputIds, inputTypes, inputPrompts, inputPlaceholders, inputFeedbackVariations }
}

/**
 * Function to extract extra styles depending on passed arguments for the input field
 * @param style - passed style option
 * @param feedbackVariation -
 */
export function getExtraStyles(style: string, feedbackVariation: string) {
  let spacing: boolean = false
  let additionalClassnames: string = ""
  let fieldWidth: number | null = null
  if (style === "NL") {
    spacing = true
  } else if (style === "TTABLE") {
    additionalClassnames =
      "focus:outline-none w-10 py-0.5 px-1 h-8 mx-0.5 my-0.5 focus-visible:ring-1 focus-visible:ring-offset-0 text-center"
  } else if (style === "MAT") {
    additionalClassnames = `w-12 p-2 mx-0.5 my-0 focus-visible:ring-1 focus-visible:ring-offset-0`
  }
  if (additionalClassnames === "") {
    if (feedbackVariation === "below") {
      additionalClassnames = "focus:outline-none"
    } else {
      additionalClassnames = "mb-1 w-full focus:outline-none"
    }
  }
  if (style.startsWith("OS")) {
    fieldWidth = Number.parseInt(style.slice(3)) * 3
  }
  return { spacing, additionalClassnames, fieldWidth }
}
