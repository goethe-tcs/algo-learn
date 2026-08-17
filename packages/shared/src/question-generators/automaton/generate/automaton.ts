import { Graph, type Edge, type Node } from "@shared/utils/graph"

export interface AutomatonNode extends Node {
  isStart?: boolean
  isEnd?: boolean
}
export class Automaton extends Graph {
  nodes: AutomatonNode[]
  isDFA: boolean

  constructor(
    nodes: AutomatonNode[],
    edges: Edge[][],
    directed: boolean,
    weighted: boolean,
    isDFA: boolean = false,
  ) {
    super(nodes, edges, directed, weighted)
    this.nodes = nodes
    this.isDFA = isDFA
  }

  /** Returns all start nodes */
  public getStartNodes(): AutomatonNode[] {
    return this.nodes.filter((node) => node.isStart)
  }

  /** Returns all end nodes */
  public getEndNodes(): AutomatonNode[] {
    return this.nodes.filter((node) => node.isEnd)
  }

  /** Fetches all outgoing edges for given node */
  public getOutgoingEdges(node: AutomatonNode): Edge[] {
    const nodeIndex = this.nodes.findIndex((n) => n.label === node.label)
    return nodeIndex !== -1 ? this.edges[nodeIndex] : []
  }

  /** Checks if node is a start state */
  public static isStartNode(node: AutomatonNode): boolean {
    return node.isStart ?? false
  }

  /** Checks if node is an end state */
  public static isEndNode(node: AutomatonNode): boolean {
    return node.isEnd ?? false
  }
}
