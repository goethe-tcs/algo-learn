import { ReactElement, useEffect, useRef } from "react"
import { Markdown } from "@/components/Markdown"

/**
 * The List of all the possible extra features for the table
 * Separate each feature with a question mark like this: "border_solid?av_middle?ah_center"
 *
 * div_ : The class for the div that contains the table
 * table_ : The class for the table
 * border_ : The border style of the table
 * av_ : The vertical alignment of the cells
 * ah_ : The horizontal alignment of the cells
 * td/tf : Transpose the table (td --> definitive, tf --> frontend decision)
 * sd/sf : Split the table in half (sd --> definitive, sf --> frontend decision)
 *
 */

/**
 * A component that returns a table
 * @param table The table to be drawn (passed as md format)
 */
export function DrawTable({
  table,
}: {
  table: { header: string[]; content: string[][]; alignment: string[]; extraFeature: string }
}): ReactElement {
  let parsedHeader = table.header
  let parsedContent = table.content
  const parsedAlignment = table.alignment
  let extraFeature = table.extraFeature

  const extraFeatureList = extraFeature.split("?")

  // TODO add the tf feature
  // transpose the table
  if (extraFeatureList.includes("td")) {
    parsedContent = transposeTable(parsedHeader, parsedContent).newContent
    parsedHeader = []
  }

  // split the table into two tables
  if (extraFeatureList.includes("sd")) {
    if (extraFeature.indexOf("sd") !== -1) {
      extraFeature = extraFeature.replace("sd", "")
    }

    if (extraFeature.includes("td")) {
      extraFeature = extraFeature.replace("td", "")
    }

    const half = Math.ceil(parsedHeader.length > 0 ? parsedHeader.length : parsedContent[0].length / 2)
    const headerFirst = parsedHeader.slice(0, half)
    const headerSecond = parsedHeader.slice(half)
    // for every line in content split this line in half
    const contentFirst = []
    const contentSecond = []
    for (let i = 0; i < parsedContent.length; i++) {
      const line = parsedContent[i]
      contentFirst.push(line.slice(0, half))
      contentSecond.push(line.slice(half))
    }

    return (
      <div>
        <div className={`mb-2`}>
          {DrawTable({
            table: {
              header: headerFirst,
              content: contentFirst,
              alignment: parsedAlignment,
              extraFeature,
            },
          })}
        </div>
        {DrawTable({
          table: {
            header: headerSecond,
            content: contentSecond,
            alignment: parsedAlignment,
            extraFeature,
          },
        })}
      </div>
    )
  }

  let borderStyle = "border"
  let cellVerticalAlign = "align-"
  let cellHorizontalAlign = "text-"

  // create the value for the header
  extraFeatureList.map((feature) => {
    if (feature.startsWith("border_")) {
      borderStyle = feature.split("_")[1]
    }
    if (feature.startsWith("av")) {
      cellVerticalAlign = feature.split("_")[1]
    }
    if (feature.startsWith("ah")) {
      cellHorizontalAlign += feature.split("_")[1]
    }
  })

  if (cellVerticalAlign === "align-") {
    cellVerticalAlign = "align-top"
  }

  const tableHeader = []

  // this effect is used to add the copy event to the table
  // it prevents copying the value with the default \t and instead with space
  const tableRef = useRef<HTMLDivElement>(null) // Specify the type of element the ref will hold
  useEffect(() => {
    const tableElement = tableRef.current
    if (!tableElement) return // Check if tableEl is not null

    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault()
      const selection = document.getSelection()
      if (!selection) return

      const selectedText = selection.toString().replace(/\t/g, " ")
      event.clipboardData!.setData("text/plain", selectedText)
    }

    // Type assertion to ensure tableEl is treated as an HTMLElement
    tableElement.addEventListener("copy", handleCopy)
    return () => {
      tableElement.removeEventListener("copy", handleCopy)
    }
  }, [])

  tableHeader.push(
    <tr key={`row-0`}>
      {parsedHeader.map((md, j) => (
        <th key={`cell-${0}-${j}`} className={`${borderStyle} p-2`}>
          <Markdown md={md} />
        </th>
      ))}
    </tr>,
  )

  const tableContent = []
  for (let i = 0; i < parsedContent.length; i++) {
    tableContent.push(
      <tr key={`row-${i}`}>
        {parsedContent[i].map((md, j) => (
          <td
            key={`cell-${i}-${j}`}
            className={`${borderStyle} p-2 text-${parsedAlignment[j]} ${cellVerticalAlign} ${cellHorizontalAlign}`}
          >
            <Markdown md={md} />
          </td>
        ))}
      </tr>,
    )
  }

  let tableClass = ""
  extraFeatureList.forEach((feature) => {
    if (feature.startsWith("table_")) {
      tableClass = feature.split("_")[1]
    }
  })

  const tableReturnValue = (
    <div ref={tableRef}>
      <table className={tableClass}>
        <thead>{tableHeader}</thead>
        <tbody>{tableContent}</tbody>
      </table>
    </div>
  )

  let divClass = ""
  extraFeatureList.forEach((feature) => {
    if (feature.startsWith("div_")) {
      divClass = feature.split("_")[1]
    }
  })

  if (extraFeature.includes("div_")) {
    return <div className={divClass}>{tableReturnValue}</div>
  } else {
    return tableReturnValue
  }
}

function transposeTable(parsedHeader: string[], parsedContent: string[][]) {
  const newContent: string[][] = []
  // the header needs to be on the left too,
  // so we add the header (if exists) to the first column of the content
  // and surround each string with **
  if (parsedHeader.length > 0) {
    for (let i = 0; i < parsedHeader.length; i++) {
      if (i >= newContent.length) {
        newContent.push([`**${parsedHeader[i]}**`])
      } else {
        newContent[i].push(`**${parsedHeader[i]}**`)
      }
    }
  }
  // then we add the content to the newContent
  for (let i = 0; i < parsedContent.length; i++) {
    for (let j = 0; j < parsedContent[i].length; j++) {
      if (j + 1 > newContent.length) {
        newContent.push([])
      }
      newContent[j].push(parsedContent[i][j])
    }
  }
  return { newContent }
}
