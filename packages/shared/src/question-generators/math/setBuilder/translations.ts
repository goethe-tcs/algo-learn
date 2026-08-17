import type { Translations } from "@shared/utils/translations"

export const translations: Translations = {
  en: {
    name: "Set Builder Notation",
    description: "Given a set in set-builder notation, determine all its elements explicitly.",
    match: "Match each set given in set-builder notation with its explicit list of elements:",
    free: "Write out all elements of the following set explicitly:",
    checkFormat: "The answer could not be parsed as a set. A valid set looks like {a, b, c}.",
    even: "even",
    odd: "odd",
    prime: "prime",
    square: "is a square",
    expression: "Expression",
    answer: "Correct Answer",
    typingAidExplanation: "Use the following buttons for easier input.",
  },
  de: {
    name: "Mengenschreibweise",
    description: "Bestimme zu einer Menge in Mengenschreibweise alle ihre Elemente explizit.",
    match:
      "Ordne jeder in Mengenschreibweise gegebenen Menge ihre explizite Aufzählung der Elemente zu:",
    free: "Schreibe alle Elemente der folgenden Menge explizit auf:",
    checkFormat:
      "Die Antwort konnte nicht als Menge gelesen werden. Eine gültige Menge sieht so aus: {a, b, c}.",
    even: "gerade",
    odd: "ungerade",
    prime: "prim",
    square: "ist eine Quadratzahl",
    expression: "Ausdruck",
    answer: "Richtige Antwort",
    typingAidExplanation: "Verwende die folgenden Buttons als Eingabehilfe.",
  },
}
