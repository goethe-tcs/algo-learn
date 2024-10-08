import {
  PseudoCode,
  PseudoCodeAssignment,
  PseudoCodeBlock,
  PseudoCodeCall,
  PseudoCodeFor,
  PseudoCodeForAll,
  PseudoCodeFunction,
  PseudoCodeFunctionName,
  PseudoCodeIf,
  PseudoCodePrint,
  PseudoCodePrintString,
  PseudoCodeReturn,
  PseudoCodeState,
  PseudoCodeString,
  PseudoCodeVariable,
  PseudoCodeWhile,
} from "@shared/utils/pseudoCodeUtils.ts"
import {
  controlFlowColor,
  functionColor,
  keyWordsColor,
  printStatementColor,
  variableColor,
} from "@/components/DrawPseudoCode.tsx"

export function pseudoCodeToString(pseudoCode: PseudoCode): {
  pseudoCodeString: string[]
  pseudoCodeStringColor: string[]
  pseudoCodeStringLatex: string[]
} {
  const pseudoCodeString: string[] = []
  const pseudoCodeStringColor: string[] = []
  const pseudoCodeStringLatex: string[] = [
    "\\begin{algorithm}[h]",
    "\\caption{NAME?}",
    "\\begin{algorithmic}[1]",
  ]
  for (const code of pseudoCode) {
    if ("state" in code) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(code)
      pseudoCodeString.push(stateString)
      pseudoCodeStringColor.push(stateStringColor)
      pseudoCodeStringLatex.push(stateStringLatex)
    } else if ("block" in code) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(code, 0)
      pseudoCodeString.push(...blockString)
      pseudoCodeStringColor.push(...blockStringColor)
      pseudoCodeStringLatex.push(...blockStringLatex)
    } else if ("name" in code) {
      const { functionString, functionStringColor, functionStringLatex } = pseudoCodeFunctionToString(
        code,
        0,
      )
      pseudoCodeString.push(...functionString)
      pseudoCodeStringColor.push(...functionStringColor)
      pseudoCodeStringLatex.push(...functionStringLatex)
    }
  }
  pseudoCodeStringLatex.push(...["\\end{algorithmic}", "\\end{algorithm}"])

  return { pseudoCodeString, pseudoCodeStringColor, pseudoCodeStringLatex }
}

function pseudoCodeFunctionToString(
  func: PseudoCodeFunction,
  indent: number,
): { functionString: string[]; functionStringColor: string[]; functionStringLatex: string[] } {
  const functionString: string[] = [
    leadingWhitespace(indent) +
      `\\textbf{function}\\text{ }\\textit{${func.name}}\\left(${func.args.join(",\\text{ }")}\\right):`,
  ]
  const functionStringColor: string[] = []
  let funcStringColorTmp: string =
    leadingWhitespace(indent) +
    `{\\color{${keyWordsColor}} \\textbf{function}}\\text{ }{\\color{${functionColor}} \\textit{${func.name}}}\\left(`
  for (let i = 0; i < func.args.length; i++) {
    funcStringColorTmp += `{\\color{${variableColor}} ${func.args[i]}}`
    if (i < func.args.length - 1) {
      funcStringColorTmp += ",  "
    }
  }
  funcStringColorTmp += "\\right):"
  functionStringColor.push(funcStringColorTmp)

  const functionStringLatex: string[] = [`\\Function{${func.name}}{${func.args.join(", ")}}`]
  if (func.body) {
    if ("state" in func.body) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(func.body)
      functionString.push(leadingWhitespace(indent + 2) + stateString)
      functionStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
      functionStringLatex.push(stateStringLatex)
    } else if ("block" in func.body) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
        func.body,
        indent + 2,
      )
      functionString.push(...blockString)
      functionStringColor.push(...blockStringColor)
      functionStringLatex.push(...blockStringLatex)
    }
  }
  functionStringLatex.push("\\EndFunction")
  return { functionString, functionStringColor, functionStringLatex }
}

function pseudoCodeBlockToString(
  block: PseudoCodeBlock,
  indent: number,
): { blockString: string[]; blockStringColor: string[]; blockStringLatex: string[] } {
  const blockStringAdd: string[] = []
  const blockStringAddColor: string[] = []
  const blockStringAddLatex: string[] = []
  for (const state of block.block) {
    if ("state" in state) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(state)
      blockStringAdd.push(leadingWhitespace(indent) + stateString)
      blockStringAddColor.push(leadingWhitespace(indent) + stateStringColor)
      blockStringAddLatex.push(stateStringLatex)
    } else if ("if" in state) {
      const { ifString, ifStringColor, ifStringLatex } = pseudoCodeIfToString(state, indent)
      blockStringAdd.push(...ifString)
      blockStringAddColor.push(...ifStringColor)
      blockStringAddLatex.push(...ifStringLatex)
    } else if ("while" in state) {
      const { whileString, whileStringColor, whileStringLatex } = pseudoCodeWhileToString(state, indent)
      blockStringAdd.push(...whileString)
      blockStringAddColor.push(...whileStringColor)
      blockStringAddLatex.push(...whileStringLatex)
    } else if ("for" in state) {
      const { forString, forStringColor, forStringLatex } = pseudoCodeForToString(state, indent)
      blockStringAdd.push(...forString)
      blockStringAddColor.push(...forStringColor)
      blockStringAddLatex.push(...forStringLatex)
    } else if ("forAll" in state) {
      const { forAllString, forAllStringColor, forAllStringLatex } = pseudocodeForAllToString(
        state,
        indent,
      )
      blockStringAdd.push(...forAllString)
      blockStringAddColor.push(...forAllStringColor)
      blockStringAddLatex.push(...forAllStringLatex)
    }
  }
  return {
    blockString: blockStringAdd,
    blockStringColor: blockStringAddColor,
    blockStringLatex: blockStringAddLatex,
  }
}

function pseudoCodeIfToString(
  ifState: PseudoCodeIf,
  indent: number,
): { ifString: string[]; ifStringColor: string[]; ifStringLatex: string[] } {
  const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(ifState.if.condition)
  const ifString: string[] = [
    leadingWhitespace(indent) + `\\textbf{if }\\text{ }${psString}\\text{ }\\textbf{then}`,
  ]
  const ifStringColor: string[] = [
    leadingWhitespace(indent) +
      `{\\color{${keyWordsColor}} \\textbf{if }}\\text{ }${psStringColor}\\text{ }{\\color{${keyWordsColor}} \\textbf{then}}`,
  ]
  const ifStringLatex: string[] = [`\\If{$${psStringLatex}$}`]
  if (ifState.if.then) {
    if ("state" in ifState.if.then) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(
        ifState.if.then,
      )
      ifString.push(leadingWhitespace(indent + 2) + stateString)
      ifStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
      ifStringLatex.push(stateStringLatex)
    } else if ("block" in ifState.if.then) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
        ifState.if.then,
        indent + 2,
      )
      ifString.push(...blockString)
      ifStringColor.push(...blockStringColor)
      ifStringLatex.push(...blockStringLatex)
    }
  }

  if (ifState.if.elseif) {
    for (let i = 0; i < ifState.if.elseif.length; i++) {
      const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(
        ifState.if.elseif[i].condition,
      )
      ifString.push(leadingWhitespace(indent) + `\\textbf{else if } ${psString}`)
      ifStringColor.push(
        leadingWhitespace(indent) + `{\\color{${keyWordsColor}} \\textbf{else if }} ${psStringColor}`,
      )
      ifStringLatex.push(`\\ElsIf{$${psStringLatex}$}`)

      if ("state" in ifState.if.elseif[i].then) {
        const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(
          ifState.if.elseif[i].then as PseudoCodeState,
        )
        ifString.push(leadingWhitespace(indent + 2) + stateString)
        ifStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
        ifStringLatex.push(stateStringLatex)
      } else if (ifState.if.elseif[i].then !== null && "block" in ifState.if.elseif[i].then) {
        const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
          ifState.if.elseif[i].then as PseudoCodeBlock,
          indent + 2,
        )
        ifString.push(...blockString)
        ifStringColor.push(...blockStringColor)
        ifStringLatex.push(...blockStringLatex)
      }
    }
  }

  if (ifState.if.else) {
    ifString.push(leadingWhitespace(indent) + `\\textbf{else}`)
    ifStringColor.push(leadingWhitespace(indent) + `{\\color{${keyWordsColor}} \\textbf{else }}`)
    ifStringLatex.push(`\\Else`)
    if (ifState.if.else !== undefined && "state" in ifState.if.else) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(
        ifState.if.else,
      )
      ifString.push(leadingWhitespace(indent + 2) + stateString)
      ifStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
      ifStringLatex.push(stateStringLatex)
    } else if (ifState.if.else !== undefined && "block" in ifState.if.else) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
        ifState.if.else,
        indent + 2,
      )
      ifString.push(...blockString)
      ifStringColor.push(...blockStringColor)
      ifStringLatex.push(...blockStringLatex)
    }
  }
  ifStringLatex.push("\\EndIf")
  return { ifString, ifStringColor, ifStringLatex }
}

function pseudoCodeWhileToString(
  whileState: PseudoCodeWhile,
  indent: number,
): { whileString: string[]; whileStringColor: string[]; whileStringLatex: string[] } {
  const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(whileState.while.condition)
  const whileString: string[] = [
    leadingWhitespace(indent) + `\\textbf{while}\\text{ }${psString}\\text{ }\\textbf{do}`,
  ]
  const whileStringColor: string[] = [
    leadingWhitespace(indent) +
      `{\\color{${keyWordsColor}}\\textbf{while}}\\text{ }${psStringColor}\\text{ }{\\color{${keyWordsColor}} \\textbf{do}}`,
  ]
  const whileStringLatex: string[] = [`\\While{$${psStringLatex}$}`]
  if (whileState.while.do) {
    if ("state" in whileState.while.do) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(
        whileState.while.do,
      )
      whileString.push(leadingWhitespace(indent + 2) + stateString)
      whileStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
      whileStringLatex.push(stateStringLatex)
    } else if ("block" in whileState.while.do) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
        whileState.while.do,
        indent + 2,
      )
      whileString.push(...blockString)
      whileStringColor.push(...blockStringColor)
      whileStringLatex.push(...blockStringLatex)
    }
  }
  whileStringLatex.push("\\EndWhile")
  return { whileString, whileStringColor, whileStringLatex }
}

function pseudoCodeForToString(
  forState: PseudoCodeFor,
  indent: number,
): { forString: string[]; forStringColor: string[]; forStringLatex: string[] } {
  const {
    psString: psStringFrom,
    psStringColor: psStringColorFrom,
    psStringLatex: psStringLatexFrom,
  } = pseudoCodeStringToString(forState.for.from)
  const {
    psString: psStringTo,
    psStringColor: psStringColorTo,
    psStringLatex: psStringLatexTo,
  } = pseudoCodeStringToString(forState.for.to)
  const forString: string[] = [
    leadingWhitespace(indent) +
      `\\textbf{for}\\text{ }${forState.for.variable}\\text{ }\\textbf{from}\\text{ }${psStringFrom}\\text{ }\\textbf{to}\\text{ }${psStringTo}`,
  ]
  const forStringColor: string[] = [
    leadingWhitespace(indent) +
      `{\\color{${keyWordsColor}} \\textbf{for}}\\text{ }{\\color{${variableColor}}${forState.for.variable}}\\text{ }{\\color{${keyWordsColor}} \\textbf{from}}\\text{ }${psStringColorFrom}\\text{ }{\\color{${keyWordsColor}} \\textbf{to}}\\text{ }${psStringColorTo}`,
  ]
  const forStringLatex: string[] = [
    `\\For{$${forState.for.variable} \\gets ${psStringLatexFrom} \\text{ to } ${psStringLatexTo}`,
  ]

  forString[0] += `\\text{ }\\textbf{do}`
  forStringColor[0] += `\\text{ }{\\color{${keyWordsColor}} \\textbf{do}}`
  forStringLatex[0] += "$}"

  if (forState.for.do) {
    if ("state" in forState.for.do) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(
        forState.for.do,
      )
      forString.push(leadingWhitespace(indent + 2) + stateString)
      forStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
      forStringLatex.push(stateStringLatex)
    } else if ("block" in forState.for.do) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
        forState.for.do,
        indent + 2,
      )
      forString.push(...blockString)
      forStringColor.push(...blockStringColor)
      forStringLatex.push(...blockStringLatex)
    }
  }
  forStringLatex.push("\\EndFor")
  return { forString, forStringColor, forStringLatex }
}

function pseudocodeForAllToString(
  forAllState: PseudoCodeForAll,
  indent: number,
): { forAllString: string[]; forAllStringColor: string[]; forAllStringLatex: string[] } {
  const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(forAllState.forAll.set)
  const forAllString: string[] = [
    leadingWhitespace(indent) +
      `\\textbf{for}\\text{ }${forAllState.forAll.variable} \\in ${psString}\\text{ }\\textbf{do}`,
  ]
  const forAllStringColor: string[] = [
    leadingWhitespace(indent) +
      `{\\color{${keyWordsColor}}\\textbf{for}}\\text{ }{\\color{${variableColor}} ${forAllState.forAll.variable}} \\in ${psStringColor}\\text{ }{\\color{${keyWordsColor}}\\textbf{do}}`,
  ]
  const forAllStringLatex: string[] = [
    `\\ForAll{$${forAllState.forAll.variable} \\in ${psStringLatex}$}`,
  ]
  if (forAllState.forAll.do) {
    if ("state" in forAllState.forAll.do) {
      const { stateString, stateStringColor, stateStringLatex } = pseudoCodeStateToString(
        forAllState.forAll.do,
      )
      forAllString.push(leadingWhitespace(indent + 2) + stateString)
      forAllStringColor.push(leadingWhitespace(indent + 2) + stateStringColor)
      forAllStringLatex.push(stateStringLatex)
    } else if ("block" in forAllState.forAll.do) {
      const { blockString, blockStringColor, blockStringLatex } = pseudoCodeBlockToString(
        forAllState.forAll.do,
        indent + 2,
      )
      forAllString.push(...blockString)
      forAllStringColor.push(...blockStringColor)
      forAllStringLatex.push(...blockStringLatex)
    }
  }
  forAllStringLatex.push("\\EndFor")
  return { forAllString, forAllStringColor, forAllStringLatex }
}

function pseudoCodeStateToString(state: PseudoCodeState): {
  stateString: string
  stateStringColor: string
  stateStringLatex: string
} {
  let stateString = ""
  let stateStringColor = ""
  let stateStringLatex = "\\State "
  if (Array.isArray(state.state)) {
    const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(state.state)
    stateString += psString
    stateStringColor += psStringColor
    stateStringLatex += psStringLatex
  } else if ("print" in state.state) {
    const { printNormal, printColor, printLatex } = pseudoCodePrintToString(state.state)
    stateString += printNormal
    stateStringColor += printColor
    stateStringLatex += printLatex
  } else if ("returnValue" in state.state) {
    const { returnNormal, returnColor, returnLatex } = pseudoCodeReturnToString(state.state)
    stateString += returnNormal
    stateStringColor += returnColor
    stateStringLatex += returnLatex
  } else if ("continueState" in state.state) {
    const { continueNormal, continueColor, continueLatex } = pseudoCodeContinueToString()
    stateString += continueNormal
    stateStringColor += continueColor
    stateStringLatex += continueLatex
  } else if ("breakState" in state.state) {
    const { breakNormal, breakColor, breakLatex } = pseudoCodeBreakToString()
    stateString += breakNormal
    stateStringColor += breakColor
    stateStringLatex += breakLatex
  } else if ("functionName" in state.state) {
    const { callNormal, callColor, callLatex } = pseudoCodeCallToString(state.state)
    stateString += callNormal
    stateStringColor += callColor
    stateStringLatex += callLatex
  } else if ("assignment" in state.state) {
    const { assignmentNormal, assignmentColor, assignmentLatex } = pseudoCodeAssignmentToString(
      state.state,
    )
    stateString += assignmentNormal
    stateStringColor += assignmentColor
    stateStringLatex += assignmentLatex
  }
  return { stateString, stateStringColor, stateStringLatex }
}

function pseudoCodeAssignmentToString(assignment: PseudoCodeAssignment): {
  assignmentNormal: string
  assignmentColor: string
  assignmentLatex: string
} {
  const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(assignment.value)
  const assignmentNormal = `${assignment.assignment} \\longleftarrow ${psString}`
  const assignmentColor = `{\\color{${variableColor}}${assignment.assignment}} \\longleftarrow ${psStringColor}`
  const assignmentLatex = `$${assignment.assignment} \\gets ${psStringLatex}$`
  return { assignmentNormal, assignmentColor, assignmentLatex }
}

function pseudoCodePrintToString(print: PseudoCodePrint): {
  printNormal: string
  printColor: string
  printLatex: string
} {
  const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(print.print)
  const printNormal = `\\text{print}\\left(${psString}\\right)`
  const printColor = `\\text{print}\\left(${psStringColor}\\right)`
  const printLatex = `print$\\left(${psStringLatex}\\right)$`
  return { printNormal, printColor, printLatex }
}

function pseudoCodeReturnToString(returnState: PseudoCodeReturn): {
  returnNormal: string
  returnColor: string
  returnLatex: string
} {
  const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(returnState.returnValue)
  const returnNormal = `\\textbf{return}\\text{ }${psString}`
  const returnColor = `{\\color{${keyWordsColor}} \\textbf{return}}\\text{ }${psStringColor}`
  const returnLatex = `\\Return $${psStringLatex}$`
  return { returnNormal, returnColor, returnLatex }
}

function pseudoCodeContinueToString(): {
  continueNormal: string
  continueColor: string
  continueLatex: string
} {
  const continueNormal = "\\textbf{continue}"
  const continueColor = `{\\color{${controlFlowColor}} \\textbf{continue}}`
  const continueLatex = "continue"
  return { continueNormal, continueColor, continueLatex }
}

function pseudoCodeBreakToString(): { breakNormal: string; breakColor: string; breakLatex: string } {
  const breakNormal = "\\textbf{break}"
  const breakColor = `{\\color{${controlFlowColor}} \\textbf{break}}`
  const breakLatex = "break"
  return { breakNormal, breakColor, breakLatex }
}

function pseudoCodeCallToString(call: PseudoCodeCall): {
  callNormal: string
  callColor: string
  callLatex: string
} {
  let callNormal = `\\textit{${call.functionName}}\\left(`
  let callColor = `{\\color{${functionColor}} \\textit{${call.functionName}}}\\left(`
  let callLatex = `\\Call{${call.functionName}}{`

  for (let i = 0; i < call.args.length; i++) {
    const { psString, psStringColor, psStringLatex } = pseudoCodeStringToString(call.args[i])
    callNormal += psString
    callColor += psStringColor
    callLatex += psStringLatex
    if (i < call.args.length - 1) {
      callNormal += ", "
      callColor += ", "
      callLatex += ", "
    }
  }

  callNormal += "\\right)"
  callColor += "\\right)"
  callLatex += "}"

  return { callNormal, callColor, callLatex }
}

function pseudoCodeStringToString(pseudoString: PseudoCodeString): {
  psString: string
  psStringColor: string
  psStringLatex: string
} {
  let psString = ""
  let psStringColor = ""
  let psStringLatex = ""
  for (let i = 0; i < pseudoString.length; i++) {
    if (typeof pseudoString[i] === "string") {
      psString += pseudoString[i] as string
      psStringColor += pseudoString[i] as string
      psStringLatex += pseudoString[i] as string
    } else if (isPseudoCodeVariable(pseudoString[i])) {
      const { variable } = pseudoString[i] as PseudoCodeVariable
      psString += variable
      psStringColor += `{\\color{${variableColor}}${variable}}`
      psStringLatex += variable
    } else if (isPseudoCodeFunctionName(pseudoString[i])) {
      const { functionName } = pseudoString[i] as PseudoCodeFunctionName
      psString += functionName
      psStringColor += `{\\color{${functionColor}}${functionName}}`
      psStringLatex += functionName
    } else if (isPseudoCodePrintString(pseudoString[i])) {
      const { printString } = pseudoString[i] as PseudoCodePrintString
      psString += printString
      psStringColor += `{\\color{${printStatementColor}}${printString}}`
      psStringLatex += printString
    }
  }

  return { psString, psStringColor, psStringLatex }
}

function isPseudoCodeVariable(
  pseudoString: string | PseudoCodeVariable | PseudoCodeFunctionName | PseudoCodePrintString,
): boolean {
  return typeof pseudoString === "object" && "variable" in pseudoString
}

function isPseudoCodeFunctionName(
  pseudoString: string | PseudoCodeVariable | PseudoCodeFunctionName | PseudoCodePrintString,
): boolean {
  return typeof pseudoString === "object" && "functionName" in pseudoString
}

function isPseudoCodePrintString(
  pseudoString: string | PseudoCodeVariable | PseudoCodeFunctionName | PseudoCodePrintString,
): boolean {
  return typeof pseudoString === "object" && "printString" in pseudoString
}

function leadingWhitespace(indent: number): string {
  return " ".repeat(indent)
}
