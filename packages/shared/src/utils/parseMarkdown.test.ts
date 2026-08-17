import { describe, expect, test } from "vitest"
import { inputRegex, parseTable } from "./parseMarkdown.ts"

describe("tables", () => {
  test("default table", () => {
    const mdTable = `|A|B|C|
|:--|:-:|--:|
|a1|b1|c1|
|a2|b2|c2|
|a3|b3|c3|
|a4|b4|c4|`

    const parsedTable = parseTable(mdTable)

    expect(parsedTable.content).toHaveLength(5)
    parsedTable.content.forEach((row) => {
      expect(row).toHaveLength(3)
    })
    expect(parsedTable.format.alignment).toEqual(["left", "center", "right"])
  })

  test("extended table", () => {
    const mdTable = `|A|B|C|
|:==|!:=:|==:|
|a1|b1|c1|
|a2|b2|c2|
|a3|b3|c3|
|-|-|-|
|a4|b4|c4|`

    const parsedTable = parseTable(mdTable)

    expect(parsedTable.content).toHaveLength(5)
    parsedTable.content.forEach((row) => {
      expect(row).toHaveLength(3)
    })
    expect(parsedTable.format.alignment).toEqual(["left", "center", "right"])
    expect(parsedTable.format.header).toBeTruthy()
    expect(parsedTable.format.hLines).toEqual([0, 3])
    expect(parsedTable.format.vLines).toEqual([0])
  })
})

describe("inputRegex", () => {
  const getMatches = (text: string) =>
    Array.from(text.matchAll(new RegExp(inputRegex.source, "g"))).map((m) => m[1])

  test("matches basic input field", () => {
    const matches = getMatches("{{id#TTABLE#Prompt#Placeholder#overlay}}")
    expect(matches).toEqual(["id#TTABLE#Prompt#Placeholder#overlay"])
  })

  test("matches empty optional segments", () => {
    const matches = getMatches("{{test####overlay}}")
    expect(matches).toEqual(["test####overlay"])
  })

  test("does not match without hash", () => {
    const matches = getMatches("{{justText}}")
    expect(matches).toEqual([])
  })

  test("matches after placeholders are formatted", () => {
    const text = "Before X mid {{id#-#A) 3 + 4 = #sum}} end"
    const matches = getMatches(text)
    expect(matches).toEqual(["id#-#A) 3 + 4 = #sum"])
  })

  test("matches multiple input fields", () => {
    const text = "{{a#TTABLE#P1##overlay}} and {{b#NL#P2##below}}"
    const matches = getMatches(text)
    expect(matches).toEqual(["a#TTABLE#P1##overlay", "b#NL#P2##below"])
  })

  test("allows single braces inside input text", () => {
    const text = "{{id#-#Set {a} to {b}#ph#below}}"
    const matches = getMatches(text)
    expect(matches).toEqual(["id#-#Set {a} to {b}#ph#below"])
  })
})
