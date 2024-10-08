import { ReactElement, useState } from "react"
import { IoColorPaletteOutline } from "react-icons/io5"
import { MdContentCopy } from "react-icons/md"
import { TbListNumbers } from "react-icons/tb"
import { PseudoCode } from "@shared/utils/pseudoCodeUtils.ts"
import { Markdown } from "@/components/Markdown.tsx"
import { Toggle } from "@/components/ui/toggle.tsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "@/hooks/useTranslation"
import { pseudoCodeToString } from "@/utils/renderPseudoCode.ts"

/*
Could use this for coloring the pseudocode
https://www.w3schools.com/tags/ref_colornames.asp
*/
export const keyWordsColor = "DodgerBlue"
export const functionColor = "DarkCyan"
export const variableColor = "IndianRed"
export const controlFlowColor = "SeaGreen"
export const printStatementColor = "Orange"

export function DrawPseudoCode({ displayCode }: { displayCode: string }): ReactElement {
  const pseudoCodeStringParse: PseudoCode = JSON.parse(displayCode) as PseudoCode

  const { pseudoCodeString, pseudoCodeStringColor, pseudoCodeStringLatex } =
    pseudoCodeToString(pseudoCodeStringParse)

  const { t } = useTranslation()

  const numCodeLines = pseudoCodeString.length

  const [toggleStateLines, setToggleStateLines] = useState(true)
  const [toggleStateColor, setToggleStateColor] = useState(true)
  const [recentlyCopied, setRecentlyCopied] = useState(false)

  const handleClickCopyIcon: () => void = () => {
    void navigator.clipboard
      .writeText(pseudoCodeStringLatex.filter((codeLine) => codeLine.trim() !== "").join("\n"))
      .then(() => setRecentlyCopied(true))
  }

  return (
    <div className="my-5">
      <div className="relative">
        <div className="min-h-28 overflow-hidden rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <div className="whitespace-nowrap">
            {toggleStateColor ? (
              <pre className="overflow-x-auto whitespace-pre py-3 pl-5 pr-10 font-mono leading-normal text-gray-900 dark:text-gray-100">
                <CodeJSX
                  currentCode={pseudoCodeStringColor}
                  toggleStateLines={toggleStateLines}
                  numCodeLines={numCodeLines}
                />
              </pre>
            ) : (
              <pre className="overflow-x-auto whitespace-pre py-3 pl-5 pr-10 font-mono leading-normal text-gray-900 dark:text-gray-100">
                <CodeJSX
                  currentCode={pseudoCodeString}
                  toggleStateLines={toggleStateLines}
                  numCodeLines={numCodeLines}
                />
              </pre>
            )}
          </div>
        </div>
        <div className="absolute right-1 top-1 flex flex-col items-center space-y-1 rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <Tooltip placement={`right`}>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  size="sm"
                  pressed={toggleStateLines}
                  onPressedChange={() => setToggleStateLines(!toggleStateLines)}
                >
                  <TbListNumbers />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("lineNumberTooltip")}</TooltipContent>
          </Tooltip>
          <Tooltip placement={`right`}>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  size="sm"
                  pressed={toggleStateColor}
                  onPressedChange={() => setToggleStateColor(!toggleStateColor)}
                >
                  <IoColorPaletteOutline />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("colorHighlightingTooltip")}</TooltipContent>
          </Tooltip>
          <Tooltip placement={`right`}>
            <TooltipTrigger asChild>
              <div
                onClick={handleClickCopyIcon}
                onMouseLeave={() => {
                  setTimeout(() => setRecentlyCopied(false), 200)
                }}
                className={`inline-flex h-8 items-center justify-center rounded-md px-2.5 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground`}
              >
                <MdContentCopy className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {(recentlyCopied ? t("copyLinkCopied") : t("copyLinkTooltip")) || ""}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

const CodeJSX = ({
  currentCode,
  toggleStateLines,
  numCodeLines,
}: {
  currentCode: string[]
  toggleStateLines: boolean
  numCodeLines: number
}) => {
  return (
    <>
      {currentCode.map((cd, index) => (
        <div key={index}>
          <span
            className={`text-right ${numCodeLines > 9 ? "min-w-8" : "min-w-6"} inline-block pr-1 ${toggleStateLines ? "text-gray-400 dark:text-gray-600" : "text-transparent"} no-select`}
          >
            {index + 1}:
          </span>
          <Markdown md={`${" ".repeat(getAmountLeadingWhiteSpaces(cd))}$${addBiggerLineSpacing(cd)}$`} />
        </div>
      ))}
    </>
  )
}

/**
 * Adds 0.15em to each line
 *
 * Otherwise the lines are too close to each other
 * For example:
 * 1: \\frac{m}{5}
 * 2: \\frac{m}{5}
 * Those nearly touch
 *
 * @param code
 */
function addBiggerLineSpacing(code: string): string {
  return `${code} \\\\[0.15em]`
}

function getAmountLeadingWhiteSpaces(text: string): number {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " ") {
      count++
    } else {
      break
    }
  }
  return count
}
