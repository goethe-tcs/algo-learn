import { RootedTree } from "@shared/utils/graph"
import { mdInputField, mdTableFromData } from "../markdownTools.ts"
import type Random from "../random.ts"
import type { DisjunctionTerms } from "./resolution.ts"

export type VariableValues = Record<string, boolean>
export type NormalForm = "CNF" | "DNF"

export type ExpressionProperties = {
  variables: string[]
  satisfiable: false | VariableValues
  falsifiable: false | VariableValues
}

export type TruthTable = boolean[]

abstract class SyntaxTreeNode {
  public negated: boolean = false

  /**
   * Returns a deep copy of the Operator
   * @returns
   */
  public abstract copy(): SyntaxTreeNode

  /**
   * Evaluates the expression for the given values
   * @param values
   */
  public abstract eval(values: VariableValues): boolean

  public abstract toString(latex: boolean): string

  /**
   * Returns the disjunction terms of the expression (has to be in CNF).
   */
  public abstract toDisjunctionTerms(): DisjunctionTerms

  /**
   * Moves negation inwards to the literals
   */
  public abstract simplifyNegation(): this

  /**
   * replaces all \\xor, => and <=> operators by an equivalent \\and / \\or expression
   */
  public abstract simplifyLocal(): this

  /**
   * replaces all \\xor, => and <=> operators by an equivalent \\and / \\or expression
   */
  public abstract simplify(): this

  /**
   * Permutes the syntax tree
   */
  public abstract shuffle(random: Random): this

  /**
   * returns an array containing all variable names in the expression
   */
  public abstract getVariableNames(): string[]

  /**
   * Returns the number of literals in the expression
   */
  public abstract getNumLiterals(): number

  public abstract isConjunction(): boolean

  public abstract isDisjunction(): boolean

  public abstract isCNF(): boolean

  public abstract isDNF(): boolean

  public negate(): this {
    this.negated = !this.negated
    return this
  }

  public abstract invertAllLiterals(): this

  /**
   * Inverts at most maxNumVariables many literals but at least one
   * @param random
   * @param maxNumVariables
   */
  public abstract invertRandomLiterals(random: Random, maxNumVariables: number): this

  protected static getTruthTableSize(vs: number | string[]): number {
    const size = typeof vs === "number" ? vs : vs.length
    return 1 << size
  }

  /**
   * Generates a truth table (array of boolean values) where each index corresponds to variable values
   * according to the numToVariableValues(index, variableNames).
   * @returns
   */
  public getTruthTable(): { truthTable: TruthTable; variableNames: string[] } {
    const variableNames = this.getVariableNames()

    const truthTableSize = SyntaxTreeNode.getTruthTableSize(variableNames)

    const truthTable: TruthTable = []
    for (let i = 0; i < truthTableSize; i++) {
      truthTable.push(this.eval(numToVariableValues(i, variableNames)))
    }

    return { truthTable, variableNames }
  }

  /**
   * Returns variable names and checks if the expression is satisfiable or falsifiable and if so providing an example in each case.
   * @returns
   */
  public getProperties(): ExpressionProperties {
    const properties: ExpressionProperties = {
      variables: this.getVariableNames(),
      satisfiable: false,
      falsifiable: false,
    }

    const truthTableSize = SyntaxTreeNode.getTruthTableSize(properties.variables)
    for (let i = 0; i < truthTableSize; i++) {
      const variableValues = numToVariableValues(i, properties.variables)
      const expressionValue = this.eval(variableValues)
      if (expressionValue) {
        properties.satisfiable = variableValues
      } else {
        properties.falsifiable = variableValues
      }

      if (properties.satisfiable !== false && properties.falsifiable !== false) return properties
    }

    return properties
  }

  private makeNormalForm(setting: {
    inner: (nodes: SyntaxTreeNodeType[]) => SyntaxTreeNodeType
    outer: (nodes: SyntaxTreeNodeType[]) => SyntaxTreeNodeType
    invert: boolean
  }): SyntaxTreeNodeType {
    const { truthTable, variableNames } = this.getTruthTable()

    const innerNodes: SyntaxTreeNodeType[] = []

    truthTable.forEach((value: boolean, index: number) => {
      if (value === setting.invert) return

      innerNodes.push(
        setting.inner(
          variableValuesToLiterals(numToVariableValues(index, variableNames), setting.invert),
        ),
      )
    })

    return setting.outer(innerNodes)
  }

  /**
   * Generates an equivalent CNF
   * @returns
   */
  public toCNF(): SyntaxTreeNodeType {
    return this.makeNormalForm({
      inner: Operator.makeDisjunction,
      outer: Operator.makeConjunction,
      invert: true,
    })
  }

  /**
   * Generates an equivalent DNF
   * @returns
   */
  public toDNF(): SyntaxTreeNodeType {
    return this.makeNormalForm({
      inner: Operator.makeConjunction,
      outer: Operator.makeDisjunction,
      invert: false,
    })
  }

  public abstract toRootedTree(): RootedTree
}

export class Literal extends SyntaxTreeNode {
  readonly name: string

  constructor(name: string, negated: boolean = false) {
    super()
    this.name = name
    this.negated = negated
  }

  public copy(): Literal {
    return new Literal(this.name, this.negated)
  }

  // does nothing on literals
  public simplifyNegation(): this {
    return this
  }

  // does nothing on literals
  public simplifyLocal(): this {
    return this
  }

  public simplify(): this {
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public shuffle(_random: Random): this {
    return this
  }

  public eval(values: VariableValues): boolean {
    return this.negated ? !values[this.name] : values[this.name]
  }

  public toString(latex: boolean = false): string {
    return this.addNegation(this.name, latex)
  }

  private addNegation(str: string, latex = false): string {
    if (this.negated) return `${latex ? operatorToLatex[negationType] : negationType} ${str}`

    return str
  }

  public getVariableNames(): string[] {
    return [this.name]
  }

  public isConjunction(): boolean {
    return true
  }

  public isDisjunction(): boolean {
    return true
  }

  public isCNF(): boolean {
    return true
  }

  public isDNF(): boolean {
    return true
  }

  public invertAllLiterals(): this {
    return this.negate()
  }

  public invertRandomLiterals(_random: Random, maxNumVariables: number): this {
    if (maxNumVariables > 0) this.negate()

    return this
  }

  getNumLiterals(): number {
    return 1
  }

  toDisjunctionTerms(): DisjunctionTerms {
    return [[this.copy()]]
  }

  public toRootedTree(): RootedTree {
    if (this.negated) return new RootedTree(`${operatorToUnicode[negationType]}${this.name}`)
    else return new RootedTree(this.name)
  }
}

const negationType = "\\not"
type NegationOperatorType = typeof negationType

export const binaryOperatorTypes = ["\\and", "\\or", "\\xor", "=>", "<=>"] as const
export type BinaryOperatorType = (typeof binaryOperatorTypes)[number]
export const associativeOperators: ReadonlyArray<BinaryOperatorType> = ["\\and", "\\or", "\\xor"]
export type AssociativeOperatorsType = (typeof associativeOperators)[number]

const operatorToLatex: Record<BinaryOperatorType | NegationOperatorType, string> = {
  "\\not": "\\neg",
  "\\and": "\\wedge",
  "\\or": "\\vee",
  "\\xor": "\\oplus",
  "=>": "\\Rightarrow",
  "<=>": "\\Leftrightarrow",
}

const operatorToUnicode: Record<BinaryOperatorType | NegationOperatorType, string> = {
  "\\not": "¬",
  "\\and": "∧",
  "\\or": "∨",
  "\\xor": "⊕",
  "=>": "⇒",
  "<=>": "⇔",
}

export function tokenToLatex(str: string) {
  for (const t in operatorToLatex) {
    str = str.replaceAll(t, `${operatorToLatex[t as keyof typeof operatorToLatex]} `)
  }

  return str
}

export class Operator extends SyntaxTreeNode {
  public type: BinaryOperatorType
  private leftOperand: SyntaxTreeNodeType
  private rightOperand: SyntaxTreeNodeType

  constructor(
    type: BinaryOperatorType,
    leftOperand: SyntaxTreeNodeType,
    rightOperand: SyntaxTreeNodeType,
    negated: boolean = false,
  ) {
    super()
    this.type = type
    this.leftOperand = leftOperand
    this.rightOperand = rightOperand
    this.negated = negated
  }

  public copy(): Operator {
    return new Operator(this.type, this.leftOperand.copy(), this.rightOperand.copy(), this.negated)
  }

  public static makeFromList(
    type: AssociativeOperatorsType,
    nodes: SyntaxTreeNodeType[],
  ): SyntaxTreeNodeType {
    if (nodes.length === 1) return nodes[0]

    let op: SyntaxTreeNodeType = nodes[0]
    for (let i = 1; i < nodes.length; i++) {
      op = new Operator(type, op, nodes[i])
    }

    return op
  }

  public static makeConjunction(nodes: SyntaxTreeNodeType[]): SyntaxTreeNodeType {
    return Operator.makeFromList("\\and", nodes)
  }

  public static makeDisjunction(nodes: SyntaxTreeNodeType[]): SyntaxTreeNodeType {
    return Operator.makeFromList("\\or", nodes)
  }

  public eval(values: VariableValues): boolean {
    let value

    switch (this.type) {
      case "\\and":
        value = this.leftOperand.eval(values) && this.rightOperand.eval(values)
        break
      case "\\or":
        value = this.leftOperand.eval(values) || this.rightOperand.eval(values)
        break
      case "\\xor":
        value = this.leftOperand.eval(values) !== this.rightOperand.eval(values)
        break
      case "=>":
        value = !this.leftOperand.eval(values) || this.rightOperand.eval(values)
        break
      case "<=>":
        value = this.leftOperand.eval(values) === this.rightOperand.eval(values)
        break
    }

    return this.negated ? !value : value
  }

  public toString(latex: boolean = false): string {
    return this.addNegation(
      `${this.addParenthesis(this.leftOperand, latex)} ${
        latex ? operatorToLatex[this.type] : this.type
      } ${this.addParenthesis(this.rightOperand, latex)}`,
      latex,
    )
  }

  private addNegation(str: string, latex: boolean = false): string {
    if (this.negated) return `${latex ? operatorToLatex[negationType] : negationType}(${str})`

    return str
  }

  public simplifyNegationLocal(): this {
    if (!this.negated) return this

    if (["\\xor", "=>", "<=>"].includes(this.type)) {
      this.simplifyLocal() // changes this.type to "\\and" or "\\or", this.leftOperand, this.rightOperand
    }

    this.negated = false

    switch (this.type) {
      case "\\and":
        this.type = "\\or"
        this.leftOperand.negate()
        this.rightOperand.negate()
        break
      case "\\or":
        this.type = "\\and"
        this.leftOperand.negate()
        this.rightOperand.negate()
        break
    }

    return this
  }

  public simplifyNegation(): this {
    this.simplifyNegationLocal()
    this.leftOperand.simplifyNegation()
    this.rightOperand.simplifyNegation()

    return this
  }

  /**
   * Replaces xor, => and <=> by an equivalent and/or expression only on the current node
   */
  public simplifyLocal(): this {
    if (["\\and", "\\or"].includes(this.type)) return this

    let newLeftOp, newRightOp
    switch (this.type) {
      case "\\xor": // a xor b  <=> (a and not b) or (not a and b)
        newLeftOp = new Operator("\\and", this.leftOperand.copy(), this.rightOperand.copy().negate())
        newRightOp = new Operator("\\and", this.leftOperand.copy().negate(), this.rightOperand.copy())
        this.leftOperand = newLeftOp
        this.rightOperand = newRightOp
        break
      case "=>": // (a => b) <=> (not a or b)
        this.leftOperand.negate()
        break
      case "<=>": // (a <=> b) <=> ((a and b) or (not a and not b))
        newLeftOp = new Operator("\\and", this.leftOperand.copy(), this.rightOperand.copy())
        newRightOp = new Operator(
          "\\and",
          this.leftOperand.copy().negate(),
          this.rightOperand.copy().negate(),
        )
        this.leftOperand = newLeftOp
        this.rightOperand = newRightOp
        break
    }

    this.type = "\\or"
    return this
  }

  /**
   * Replaces all xor, => and <=> by an equivalent and/or expression
   */
  public simplify(): this {
    this.simplifyLocal()
    this.leftOperand.simplify()
    this.rightOperand.simplify()

    return this
  }

  public shuffle(random: Random): this {
    // obscure operators
    if (random.bool(0.2)) {
      if (["=>", "<=>", "\\xor"].includes(this.type)) {
        this.simplifyLocal()
      } else if (this.type === "\\and") {
        this.type = "=>"
        this.negate()
        this.rightOperand.negate()
      } else if (this.type === "\\or") {
        this.type = "=>"
        this.leftOperand.negate()
      }
    }

    // obscure negation
    if (random.bool(0.3) && this.negated) {
      this.simplifyNegationLocal()
    }

    // permute syntax tree
    if (this.type !== "=>") {
      switch (random.int(0, 5)) {
        case 0:
          ;[this.leftOperand, this.rightOperand] = [this.rightOperand, this.leftOperand]
          break
        case 1:
          if (
            isOperator(this.leftOperand) &&
            this.leftOperand.type === this.type &&
            !this.leftOperand.negated
          ) {
            if (random.bool()) {
              ;[this.rightOperand, this.leftOperand.rightOperand] = [
                this.leftOperand.rightOperand,
                this.rightOperand,
              ]
            } else {
              ;[this.rightOperand, this.leftOperand.leftOperand] = [
                this.leftOperand.leftOperand,
                this.rightOperand,
              ]
            }
          }
          break
        case 2:
          if (
            isOperator(this.rightOperand) &&
            this.rightOperand.type === this.type &&
            !this.rightOperand.negated
          ) {
            if (random.bool()) {
              ;[this.leftOperand, this.rightOperand.rightOperand] = [
                this.rightOperand.rightOperand,
                this.leftOperand,
              ]
            } else {
              ;[this.leftOperand, this.rightOperand.leftOperand] = [
                this.rightOperand.leftOperand,
                this.leftOperand,
              ]
            }
          }
          break
        case 3:
          if (
            isOperator(this.leftOperand) &&
            isOperator(this.rightOperand) &&
            this.type === this.leftOperand.type &&
            this.type === this.rightOperand.type &&
            !this.leftOperand.negated &&
            !this.rightOperand.negated
          ) {
            if (random.bool()) {
              if (random.bool()) {
                ;[this.leftOperand.leftOperand, this.rightOperand.leftOperand] = [
                  this.rightOperand.leftOperand,
                  this.leftOperand.leftOperand,
                ]
              } else {
                ;[this.leftOperand.leftOperand, this.rightOperand.rightOperand] = [
                  this.rightOperand.rightOperand,
                  this.leftOperand.leftOperand,
                ]
              }
            } else {
              if (random.bool()) {
                ;[this.leftOperand.rightOperand, this.rightOperand.leftOperand] = [
                  this.rightOperand.leftOperand,
                  this.leftOperand.rightOperand,
                ]
              } else {
                ;[this.leftOperand.rightOperand, this.rightOperand.rightOperand] = [
                  this.rightOperand.rightOperand,
                  this.leftOperand.rightOperand,
                ]
              }
            }
          }
          break
      }
    }

    this.leftOperand.shuffle(random)
    this.rightOperand.shuffle(random)
    return this
  }

  private addParenthesis(node: SyntaxTreeNodeType, latex: boolean): string {
    if (!isOperator(node)) return node.toString(latex)

    if (node.type === this.type && associativeOperators.includes(this.type)) return node.toString(latex)

    return `(${node.toString(latex)})`
  }

  public getVariableNames(): string[] {
    return [...this.leftOperand.getVariableNames(), ...this.rightOperand.getVariableNames()]
      .sort()
      .reduce((names: string[], nextName: string) => {
        if (names[names.length - 1] !== nextName) names.push(nextName)
        return names
      }, [])
  }

  public isConjunction(): boolean {
    return this.type === "\\and" && this.leftOperand.isConjunction() && this.rightOperand.isConjunction()
  }

  public isDisjunction(): boolean {
    return this.type === "\\or" && this.leftOperand.isDisjunction() && this.rightOperand.isDisjunction()
  }

  public isCNF(): boolean {
    return (
      (this.type === "\\and" &&
        (this.leftOperand.isCNF() || this.leftOperand.isDisjunction()) &&
        (this.rightOperand.isCNF() || this.rightOperand.isDisjunction())) ||
      (this.type === "\\or" && this.leftOperand.isDisjunction() && this.rightOperand.isDisjunction())
    )
  }

  public isDNF(): boolean {
    return (
      (this.type === "\\or" &&
        (this.leftOperand.isDNF() || this.leftOperand.isConjunction()) &&
        (this.rightOperand.isDNF() || this.rightOperand.isConjunction())) ||
      (this.type === "\\and" && this.leftOperand.isConjunction() && this.rightOperand.isConjunction())
    )
  }

  public invertAllLiterals(): this {
    this.leftOperand.invertAllLiterals()
    this.rightOperand.invertAllLiterals()

    return this
  }

  public invertRandomLiterals(random: Random, maxNumVariables: number): this {
    if (maxNumVariables > 0) {
      const [maxNumVariablesLeft, maxNumVariablesRight] = random.partition(maxNumVariables, 2)
      this.leftOperand.invertRandomLiterals(random, maxNumVariablesLeft)
      this.rightOperand.invertRandomLiterals(random, maxNumVariablesRight)
    }

    return this
  }

  public getNumLiterals(): number {
    return this.leftOperand.getNumLiterals() + this.rightOperand.getNumLiterals()
  }

  toRootedTree(): RootedTree {
    let op = new RootedTree(operatorToUnicode[this.type], [
      this.leftOperand.toRootedTree(),
      this.rightOperand.toRootedTree(),
    ])
    if (this.negated) op = new RootedTree(operatorToUnicode[negationType], [op])

    return op
  }

  toDisjunctionTerms(): DisjunctionTerms {
    if (!this.isCNF()) {
      throw new Error("Expression has to be CNF to compute the disjunction terms.")
    }
    if (this.type === "\\and") {
      return [...this.leftOperand.toDisjunctionTerms(), ...this.rightOperand.toDisjunctionTerms()]
    } else {
      return [
        [
          ...this.leftOperand.toDisjunctionTerms().flat(),
          ...this.rightOperand.toDisjunctionTerms().flat(),
        ],
      ]
    }
  }
}

export type SyntaxTreeNodeType = Operator | Literal

function isOperator(obj: any): obj is Operator {
  return obj instanceof Operator
}

/**
 * Turns a number into a name/value object. The i-th bit of num is interpreted as the value of the i-th variable.
 * @param num
 * @param variableNames
 * @returns
 */
export function numToVariableValues(num: number, variableNames: string[]): VariableValues {
  const values: VariableValues = {}
  let i = 0
  while (num && i < variableNames.length) {
    values[variableNames[i]] = (num & 1) === 1
    num >>= 1
    i++
  }

  for (; i < variableNames.length; i++) {
    values[variableNames[i]] = false
  }

  return values
}

/**
 *
 * @param variableValues Object of variable name / value pairs
 * @param invert
 * @returns Array of one literal for each variable. The literal is negated if the value is false.
 *          If invert is true the literal is negated if the value is true
 */
export function variableValuesToLiterals(
  variableValues: VariableValues,
  invert: boolean,
): SyntaxTreeNodeType[] {
  const nodes: SyntaxTreeNodeType[] = []

  for (const varName in variableValues) {
    nodes.push(new Literal(varName, variableValues[varName] === invert))
  }

  return nodes
}

/**
 * Error class that could be thrown by PropositionalLogicParser.
 * The infoToStr() function can show the position of a missing or unexpected token.
 */
export class ParserError extends Error {
  readonly str: string | undefined
  readonly pos: number | undefined

  constructor(msg: string, str?: string, pos?: number) {
    super(msg)
    this.str = str
    this.pos = pos
  }

  public infoToStr(): string {
    if (this.str === undefined) return ""

    // todo shorten the string if longer than 60 chars
    let str = `"${this.str}"\n`
    if (this.pos !== undefined) str += `${" ".repeat(this.pos + 1)}^`

    return str
  }
}

export class PropositionalLogicParser {
  private static parseRec(str: string): SyntaxTreeNodeType {
    str = str.trim()

    // A valid string starts with a possible negated operand.
    // An operand is either a variable or a group starting with a parenthesis.
    // strBeginning[0] is the whole matched string
    // strBeginning[1] = "\\not" | undefined
    // strBeginning[2] = "(" | string (without whitespace)
    const strBeginning = /^(\\not)?\s*(\(|[^\s()\\=<]+)/.exec(str)
    if (strBeginning === null) throw new ParserError("Empty expression")
    else if (binaryOperatorTypes.includes(strBeginning[2] as BinaryOperatorType))
      throw new ParserError(
        "Unexpected token",
        str,
        strBeginning[1] === undefined ? 0 : strBeginning[1].length,
      )

    let leftOperand
    let nextTokenStartIndex
    // if the first operand is a group, find where the group ends and parse that part recursively
    if (strBeginning[2] === "(") {
      nextTokenStartIndex =
        PropositionalLogicParser.findClosingParenthesisPos(str, strBeginning[0].length - 1) + 1
      leftOperand = PropositionalLogicParser.parseRec(
        str.substring(strBeginning[0].length, nextTokenStartIndex - 1),
      )
    } else {
      nextTokenStartIndex = strBeginning[0].length
      leftOperand = new Literal(strBeginning[2])
    }

    // left operand is negated
    if (strBeginning[1] !== undefined) leftOperand.negate()

    // nothing else in the string
    if (nextTokenStartIndex === str.length) return leftOperand

    // if the string is not fully parsed yet, the next token has to be an operator
    const nextTokenRegEx = /^\s*(\\or|\\and|\\xor|=>|<=>)/g
    str = str.substring(nextTokenStartIndex)
    const operator = nextTokenRegEx.exec(str)
    if (operator === null || !binaryOperatorTypes.includes(operator[1] as BinaryOperatorType)) {
      throw new ParserError("Missing operator", str, nextTokenStartIndex)
    }

    return new Operator(
      operator[1] as BinaryOperatorType,
      leftOperand,
      PropositionalLogicParser.parseRec(str.slice(operator[0].length)),
    )
  }

  public static parse(str: string): SyntaxTreeNodeType | ParserError {
    try {
      return PropositionalLogicParser.parseRec(str)
    } catch (e) {
      if (e instanceof ParserError) return e

      throw e
    }
  }

  /**
   * @param str
   * @param start index of the opening parenthesis to be matched
   * @returns index of the closing parenthesis
   */
  private static findClosingParenthesisPos(str: string, start: number = 0): number {
    let level = 1
    for (let i = start + 1; i < str.length; i++) {
      if (["(", ")"].includes(str[i])) {
        if (str[i] === "(") level++
        else if (str[i] === ")") level--

        if (level === 0) return i
      }
    }

    throw new ParserError(`Missing closing parenthesis (level: ${level})`)
  }
}

function generateBetterRandomExpression(
  random: Random,
  allVariableNames: string[],
  numLeaves: number,
  parentOperator: BinaryOperatorType | null = null,
  restrictedVariableNames: string[] | null = null,
): [string[], SyntaxTreeNodeType] {
  if (restrictedVariableNames === null) restrictedVariableNames = allVariableNames

  if (numLeaves === 1) {
    const variableName = random.choice(restrictedVariableNames)
    return [[variableName], new Literal(variableName, random.bool(0.2))]
  }

  // at this point we have at least 2 more leaves, so we need to assure that either there are enough allowed variable names
  // or we switch to a different operator than the parent in order to use the whole set of variable names again
  const allowedOperators =
    restrictedVariableNames.length < 2
      ? binaryOperatorTypes.filter((o) => o !== parentOperator)
      : binaryOperatorTypes
  const thisOperator = random.weightedChoice(
    allowedOperators,
    allowedOperators.length < binaryOperatorTypes.length
      ? [0.35, 0.1, 0.1, 0.1]
      : [0.35, 0.35, 0.1, 0.1, 0.1],
  )

  const restrictVariableNames: boolean =
    ["\\and", "\\or"].includes(thisOperator) && thisOperator === parentOperator

  if (!restrictVariableNames) restrictedVariableNames = allVariableNames

  if (numLeaves === 2) {
    // if both children are leaves, make sure they are not the same
    const varNames = random.subset(restrictedVariableNames, 2)
    return [
      // only report the used variable names to the parent if it is the same operator and it is \\and or \\or
      restrictVariableNames ? varNames : [],
      new Operator(
        thisOperator,
        new Literal(varNames[0], random.bool(0.2)),
        new Literal(varNames[1], random.bool(0.2)),
      ),
    ]
  }

  // At this point we have at least 3 more leaves, so we distribute them over the two branches of this operator and recurse
  const [leftNumLeaves, rightNumLeaves] = random.partition(numLeaves, 2, 1)

  // if the right subtree will be a leave, reserve its name
  const reservedName = rightNumLeaves === 1 ? random.choice(restrictedVariableNames) : null

  const [leftVars, leftOperand] = generateBetterRandomExpression(
    random,
    allVariableNames,
    leftNumLeaves,
    thisOperator,
    reservedName === null
      ? restrictedVariableNames
      : restrictedVariableNames.filter((v) => v !== reservedName),
  )

  const [rightVars, rightOperand] = generateBetterRandomExpression(
    random,
    allVariableNames,
    rightNumLeaves,
    thisOperator,
    reservedName === null
      ? restrictedVariableNames.filter((v) => !leftVars.includes(v))
      : [reservedName],
  )

  return [
    // only report the used variable names to the parent if it is the same operator and it is \\and or \\or
    restrictVariableNames ? leftVars.concat(rightVars) : [],
    new Operator(thisOperator, leftOperand, rightOperand),
  ]
}

export function generateRandomExpression(
  random: Random,
  numLeaves: number,
  variableNames: string[],
): SyntaxTreeNodeType {
  return generateBetterRandomExpression(random, variableNames, numLeaves)[1]
}

export function generateRandomTautology(
  random: Random,
  numLeaves: number,
  variableNames: string[],
): SyntaxTreeNodeType {
  const operand = generateRandomExpression(random, Math.floor(numLeaves / 2), variableNames)
  const rootOperator = random.weightedChoice(
    ["\\or", "<=>", "=>", "\\xor"] as BinaryOperatorType[],
    [0.6, 0.15, 0.15, 0.1],
  )
  if (rootOperator === "\\or") {
    return new Operator(rootOperator, operand.copy().negate(), operand).shuffle(random)
  } else {
    return new Operator(rootOperator, operand.copy(), operand).shuffle(random)
  }
}

export function generateRandomContradiction(
  random: Random,
  numLeaves: number,
  variableNames: string[],
): SyntaxTreeNodeType {
  const operand = generateRandomExpression(random, Math.floor(numLeaves / 2), variableNames)
  const rootOperator = random.weightedChoice(
    ["\\and", "<=>", "\\xor"] as BinaryOperatorType[],
    [0.7, 0.2, 0.1],
  )
  if (rootOperator === "\\xor") {
    return new Operator(rootOperator, operand.copy(), operand).shuffle(random)
  } else {
    return new Operator(rootOperator, operand.copy().negate(), operand).shuffle(random)
  }
}

/**
 * Checks if a list of expressions is equivalent
 * @param expressions - list of boolean expression
 */
export function compareExpressions(expressions: SyntaxTreeNodeType[]): boolean {
  if (expressions.length < 2) {
    throw new Error("At least two expressions are required for comparison.")
  }
  // Collect all var names, remove duplicates and sort
  const vars = [...new Set(expressions.flatMap((expr) => expr.getTruthTable().variableNames))].sort()

  for (let i = 0; i < Math.pow(2, vars.length); i++) {
    const truthValues = numToVariableValues(i, vars)
    // Evaluate the first expression as the baseline comparison
    const firstResult = expressions[0].eval(truthValues)

    // compare each other expr with the base
    for (let j = 1; j < expressions.length; j++) {
      if (expressions[j].eval(truthValues) !== firstResult) {
        return false
      }
    }
  }
  return true
}

/**
 * Checks if no two expressions in a list are equivalent.
 * @param expressions
 */
export function arePairwiseInequivalent(expressions: SyntaxTreeNodeType[]): boolean {
  for (let i = 0; i < expressions.length; i++) {
    for (let j = i + 1; j < expressions.length; j++) {
      if (compareExpressions([expressions[i], expressions[j]])) return false
    }
  }
  return true
}

export function getMdTruthTable(
  formulas: (
    | SyntaxTreeNodeType
    | {
        formula: SyntaxTreeNodeType
        shortName?: string
        input?: boolean
      }
  )[],
): { mdTable: string; inputFieldIds: string[] } {
  const variables: string[] = []
  formulas.forEach((f) => {
    const formula = "formula" in f ? f.formula : f
    variables.push(...formula.getVariableNames())
  })

  const uniqueVars = [...new Set(variables)].sort()

  // generate table header
  const inputFieldIds: string[] = []
  const header: string[] = []
  const rows: string[][] = []
  const vLines: number[] = [uniqueVars.length - 1]

  uniqueVars.forEach((v) => {
    header.push(`$${v}$`)
  })

  formulas.forEach((f) => {
    let colName: string
    if ("formula" in f) {
      if ("shortName" in f && f.shortName) colName = f.shortName
      else colName = `$${f.formula.toString(true)}$`
    } else {
      colName = `$${f.toString(true)}$`
    }

    header.push(`${colName}`)
  })

  // generate table rows
  const numRows = 1 << uniqueVars.length
  for (let rowId = 0; rowId < numRows; rowId++) {
    const row: string[] = []

    const varValues = numToVariableValues(rowId, uniqueVars)
    uniqueVars.forEach((v) => {
      row.push(`$${varValues[v] ? 1 : 0}$`)
    })

    formulas.forEach((f, colId) => {
      let val: boolean
      if ("formula" in f) {
        if ("input" in f && f.input) {
          const fieldId = `ti-${rowId}-${colId}`
          inputFieldIds.push(fieldId)
          row.push(mdInputField(fieldId, "TTABLE"))
          return // works like continue in forEach()
        }
        val = f.formula.eval(varValues)
      } else {
        val = f.eval(varValues)
      }

      row.push(`$${val ? 1 : 0}$`)
    })

    rows.push(row)
  }

  return { mdTable: mdTableFromData(rows, "center", header, [], vLines), inputFieldIds }
}
