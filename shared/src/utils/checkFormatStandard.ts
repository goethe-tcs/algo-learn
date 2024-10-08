/**
 * This file includes standard checkFormat functions which could be used in the question generators.
 */
import { FreeTextFormatFunction } from "@shared/api/QuestionGenerator"
import { createArrayDisplayCodeBlock } from "@shared/utils/arrayDisplayCodeBlock.ts"
import { t, Translations } from "@shared/utils/translations"

export type ArraySeparator = "," | " " | ", "

const checkFormatTranslations: Translations = {
  en: {
    empty: "The answer is empty.",
    formatAnyArray: "The answer must be a comma-separated list of values.",
    formatIntArray: "The answer must be a comma-separated list of integers.",
  },
  de: {
    empty: "Die Antwort ist leer.",
    formatAnyArray: "Die Antwort muss eine kommaseparierte Liste von Werten sein.",
    formatIntArray: "Die Antwort muss eine kommaseparierte Liste von ganzzahligen Werten sein.",
  },
}

/**
 * Checks if the given text is an array
 * @param text
 * @param sep
 */
function isAnyArray(text: string, sep: ArraySeparator) {
  return parseStringToArray(text, sep).length > 0
}

/**
 * Checks if the given text is an array of integers
 * @param text
 * @param sep
 */
function isIntArray(text: string, sep: ArraySeparator) {
  if (!isAnyArray(text, sep)) {
    return false
  }

  // Split the text by comma and filter out any empty strings caused by trailing commas
  const values = parseStringToArray(text, ", ")

  // Check if every value is an integer
  return values.every((value) => {
    const trimmedValue = value.trim()
    return (
      Number.isInteger(parseFloat(trimmedValue)) &&
      trimmedValue === parseInt(trimmedValue, 10).toString()
    )
  })
}

/**
 * Converts a string into an array (seperated by comma)
 * @param text - string to be converted
 * @param sep - separator used to split the string
 */
export function parseStringToArray(text: string, sep: ArraySeparator) {
  let textSplit: string[]
  if (sep === " " || sep === ",") {
    textSplit = text.split(sep)
  } else {
    textSplit = text.split(/[ ,]+/)
  }
  textSplit = textSplit.map((value) => value.trim())
  // if the last value is empty --> drop it
  if (textSplit[textSplit.length - 1] === "") {
    textSplit.pop()
  }
  return textSplit
}

export function checkFormatArray({
  lang,
  values = "any",
}: {
  lang: "de" | "en"
  values: "any" | "int"
}) {
  const normal: FreeTextFormatFunction = ({ text }) => {
    if (text === "") {
      return { valid: false }
    }

    return values === "any"
      ? isAnyArray(text, ", ")
        ? { valid: true }
        : { valid: false, message: t(checkFormatTranslations, lang, "formatAnyArray") }
      : isIntArray(text, ", ")
        ? { valid: true }
        : { valid: false, message: t(checkFormatTranslations, lang, "formatIntArray") }
  }

  const display: FreeTextFormatFunction = ({ text }) => {
    if (text === "") {
      return { valid: false }
    }

    return values === "any"
      ? isAnyArray(text, ", ")
        ? {
            valid: true,
            message: createArrayDisplayCodeBlock({
              array: parseStringToArray(text, ", "),
            }),
          }
        : { valid: false, message: t(checkFormatTranslations, lang, "formatAnyArray") }
      : isIntArray(text, ", ")
        ? {
            valid: true,
            message: createArrayDisplayCodeBlock({
              array: parseStringToArray(text, ", "),
            }),
          }
        : { valid: false, message: t(checkFormatTranslations, lang, "formatIntArray") }
  }

  return { normal, display }
}
