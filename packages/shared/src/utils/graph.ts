import type Random from "./random"

type NodeId = number
export type NodeList = Node[]
export type EdgeList = Edge[][]
export type ClickEventType = "none" | "select" | "group" | "selectupgrade" | "groupupgrade"

export function nodeInputFieldID(idNum: number) {
  return `node-field-${idNum}`
}
export function edgeInputFieldID(idNum: number) {
  return `edge-field-${idNum}`
}

/**
 * A node in a graph.
 * @property label - A name of the node.
 * @property group - The group to which the node belongs. Can be used e.g. for node coloring
 * @property coords - The coordinates the node is placed.
 */
export interface Node {
  label?: string
  group?: number | null
  coords: { x: number; y: number }
}

/**
 * An edge between two nodes in a graph.
 * @property source - The source node of the edge.
 * @property target - The target node of the edge.
 * @property value - The value of the edge, e.g. weight or travel time
 * @property group - Can be used e.g. for edge coloring
 */
export interface Edge {
  source: NodeId
  target: NodeId
  value?: number
  group?: number | null
}

/**
 * A graph.
 * @property nodes - The nodes of the graph.
 * @property links - The links of the graph.
 * @property inputFieldID - A unique ID for the input field associated with the graph.
 */
export class Graph {
  nodes: NodeList
  edges: EdgeList
  weighted: boolean
  directed: boolean
  public inputFieldID: number | null
  public nodeDraggable: boolean
  public nodeClickType: ClickEventType
  public edgeClickType: ClickEventType
  // groups are counted from 0 to [node|edge]GroupMax -1
  public nodeGroupMax: number
  public edgeGroupMax: number

  constructor(
    nodes: NodeList,
    edges: EdgeList,
    directed: boolean,
    weighted: boolean,
    inputFieldID: number | null = null,
    nodeDraggable: boolean = false,
    nodeClick: ClickEventType = "none",
    edgeClick: ClickEventType = "none",
    nodeGroupMax: number = 1,
    edgeGroupMax: number = 1,
  ) {
    this.nodes = nodes
    this.edges = edges
    this.directed = directed
    this.weighted = weighted
    this.inputFieldID = inputFieldID
    this.nodeDraggable = nodeDraggable
    this.nodeClickType = nodeClick
    this.edgeClickType = edgeClick
    this.nodeGroupMax = nodeGroupMax
    this.edgeGroupMax = edgeGroupMax
  }

  public getDimensions(): {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
  } {
    const dims = {
      minX: this.nodes[0].coords.x,
      maxX: this.nodes[0].coords.x,
      minY: this.nodes[0].coords.y,
      maxY: this.nodes[0].coords.y,
      width: 0,
      height: 0,
    }
    this.nodes.forEach((u) => {
      dims.minX = Math.min(dims.minX, u.coords.x)
      dims.maxX = Math.max(dims.maxX, u.coords.x)
      dims.minY = Math.min(dims.minY, u.coords.y)
      dims.maxY = Math.max(dims.maxY, u.coords.y)
    })

    dims.width = dims.maxX - dims.minX
    dims.height = dims.maxY - dims.minY

    return dims
  }

  public toString(): string {
    const clickTypeMapping: Record<ClickEventType, string> = {
      none: "0",
      select: "1",
      group: "2",
      selectupgrade: "3",
      groupupgrade: "4",
    }
    let graphStr = `${this.nodes.length} ${this.getNumEdges()} ${this.directed ? "1" : "0"} ${this.weighted ? "1" : "0"} ${this.inputFieldID} ${this.nodeDraggable ? "1" : "0"} ${clickTypeMapping[this.nodeClickType]} ${clickTypeMapping[this.edgeClickType]} ${this.nodeGroupMax ?? "0"} ${this.edgeGroupMax ?? "0"}\n`

    for (const node of this.nodes) {
      graphStr += `${Math.round(node.coords.x * 100) / 100} ${Math.round(node.coords.y * 100) / 100} ${node.group ?? "-"} "${node.label ?? ""}"\n`
    }

    for (const neighbors of this.edges) {
      for (const edge of neighbors) {
        graphStr += `${edge.source} ${edge.target} ${edge.group ?? "-"}`
        if (this.weighted) graphStr += ` ${edge.value}`
        graphStr += `\n`
      }
    }

    return graphStr
  }

  public toMarkdown(): string {
    return `\n\`\`\`graph\n${this.toString()}\n\`\`\`\n`
  }

  public static parse(graphStr: string): Graph {
    const lines = graphStr.split("\n")
    const graphMetaData = lines[0].match(
      /^(\d+) (\d+) ([01]) ([01]) (null|\d+) ([01]) ([01234]) ([01234]) (\d+) (\d+)$/,
    )

    if (graphMetaData === null) throw Error(`Input error: graph data has invalid meta data: ${lines[0]}`)
    const numNodes = parseInt(graphMetaData[1])
    const numEdges = parseInt(graphMetaData[2])
    const directed = graphMetaData[3] === "1"
    const weighted = graphMetaData[4] === "1"
    const inputFieldID = graphMetaData[5] === "null" ? null : parseInt(graphMetaData[5])
    if (inputFieldID === null && graphMetaData[5] !== "null") {
      throw Error("Input error: invalid input field identifier")
    }
    const nodeDraggable = graphMetaData[6] === "1"
    const clickTypeMapping: Record<string, ClickEventType> = {
      "0": "none",
      "1": "select",
      "2": "group",
      "3": "selectupgrade",
      "4": "groupupgrade",
    }
    const nodeClick = clickTypeMapping[graphMetaData[7]]
    const edgeClick = clickTypeMapping[graphMetaData[8]]
    const nodeGroupMax = parseInt(graphMetaData[9])
    const edgeGroupMax = parseInt(graphMetaData[10])

    if (lines.length < numNodes + numEdges + 1) throw Error("Input error: graph data is incomplete")
    if (nodeClick === undefined || edgeClick === undefined)
      throw Error("Input error: click events invalid")
    if (nodeGroupMax > 8 || edgeGroupMax > 8) throw Error("Input error: too many groups (max 8)")

    const nodes: Node[] = []
    const nodesEnd = numNodes + 1
    for (let i = 1; i < nodesEnd; i++) {
      const nodeData = lines[i].match(/^(-?\d+(?:\.\d{1,2})?) (-?\d+(?:\.\d{1,2})?) (-|\d+) "(.*)"$/)
      if (nodeData === null) throw Error("Input error: invalid node data: " + lines[i])
      if (
        !(nodeData[3] === "-") &&
        (parseInt(nodeData[3]) > nodeGroupMax - 1 || parseInt(nodeData[3]) < 0)
      ) {
        throw Error("Input error: node group too large: " + lines[i])
      }

      nodes.push({
        coords: { x: parseFloat(nodeData[1]), y: parseFloat(nodeData[2]) },
        group: nodeData[3] === "-" ? null : parseInt(nodeData[3]),
        label: nodeData[4],
      })
    }

    const edgeEnd = nodesEnd + numEdges
    const edgeRegex = weighted ? /^(\d+) (\d+) (-|\d+) (\d+)$/ : /^(\d+) (\d+) (-|\d+)$/

    const edges: EdgeList = Array.from(Array(numNodes), () => [])

    for (let i = nodesEnd; i < edgeEnd; i++) {
      const edgeData = lines[i].match(edgeRegex)
      if (edgeData === null) throw Error("Input error: invalid edge data: " + lines[i])
      if (
        !(edgeData[3] === "-") &&
        (parseInt(edgeData[3]) > edgeGroupMax - 1 || parseInt(edgeData[3]) < 0)
      ) {
        throw Error("Input error: edge group too large: " + lines[i])
      }

      const source = parseInt(edgeData[1])
      edges[source].push({
        source: source,
        target: parseInt(edgeData[2]),
        group: edgeData[3] === "-" ? null : parseInt(edgeData[3]),
        value: edgeData[4] !== undefined ? parseInt(edgeData[4]) : undefined,
      })
    }

    return new Graph(
      nodes,
      edges,
      directed,
      weighted,
      inputFieldID,
      nodeDraggable,
      nodeClick,
      edgeClick,
      nodeGroupMax,
      edgeGroupMax,
    )
  }

  public clone(): Graph {
    return new Graph(
      [...this.nodes],
      [...this.edges],
      this.directed,
      this.weighted,
      this.inputFieldID,
      this.nodeDraggable,
      this.nodeClickType,
      this.edgeClickType,
      this.nodeGroupMax,
      this.edgeGroupMax,
    )
  }

  public getNeighbors(u: NodeId) {
    return this.edges[u]
  }

  public getEdge(u: NodeId, v: NodeId) {
    for (const e of this.edges[u]) {
      if (e.target === v) return e
    }

    throw new Error("Input Error: Edge does not exist")
  }

  public getNumNodes(): number {
    return this.nodes.length
  }

  /**
   * Returns the number of directed edges. For an undirected graph this number is twice the actual edges.
   */
  public getNumEdges() {
    let numEdges = 0
    for (const neighbors of this.edges) numEdges += neighbors.length

    return numEdges
  }

  public setNodeClickType(type: ClickEventType): this {
    this.nodeClickType = type
    return this
  }

  public setEdgeClickType(type: ClickEventType): this {
    this.edgeClickType = type
    return this
  }

  public setDraggable(on: boolean): this {
    this.nodeDraggable = on
    return this
  }

  public setEdgeWeight(u: NodeId, v: NodeId, weight: number): void {
    this.getEdge(u, v).value = weight
    if (!this.directed) this.getEdge(v, u).value = weight
  }

  public setNodeGroup(u: NodeId, group: number | null): void {
    if (group === null) {
      this.nodes[u].group = null
      return
    }
    if (group > this.nodeGroupMax || group < 0)
      throw Error("Input error: node group too large or negative")
    this.nodes[u].group = group
  }

  public setEdgeGroup(u: NodeId, v: NodeId, group: number | null): void {
    if (group === null) {
      this.getEdge(u, v).group = null
      if (!this.directed) this.getEdge(v, u).group = null
      return
    }
    if (group > this.edgeGroupMax || group < 0)
      throw Error("Input error: edge group too large or negative")
    this.getEdge(u, v).group = group
    if (!this.directed) this.getEdge(v, u).group = group
  }

  public getReachableNodes(u: NodeId) {
    return findReachableNodes(u, this.getNumNodes(), this.edges)
  }

  public isStronglyConnected(): boolean {
    const loopEnd = this.directed ? this.nodes.length : 1
    for (let u = 0; u < loopEnd; u++) {
      if (this.getReachableNodes(u).unreachable.length > 0) return false
    }

    return true
  }
}

/**
 * Generates labels based on the index (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, 27 -> AB, ...)
 * @param i
 */
export function getNodeLabel(i: number): string {
  let label: string = ""
  do {
    const a = i % 26
    i = (i - a) / 26
    label = String.fromCharCode(65 + a) + label
  } while (i > 0)

  return label
}

export class RandomGraph {
  /**
   * Generates planar grid graphs in various shapes
   * @param random
   * @param width Number of nodes in a row
   * @param height number of rows of nodes
   * @param p Probability for an edge to exist
   * @param shape
   * @param weights
   * @param directed
   * @param shakeUpNodePosition Randomizes the coordinates of the nodes to break up the strict grid look.
   * @param ensureStronglyConnected If true, the generated graph is guaranteed to be strongly connected.
   *                                The result may violate the p parameter.
   */
  public static grid(
    random: Random,
    [width, height]: [number, number],
    p: number,
    shape: "square" | "square-width-diagonals" | "triangle",
    weights: "random" | "unique" | null,
    directed: boolean = false,
    shakeUpNodePosition: boolean = false,
    ensureStronglyConnected: boolean = false,
  ): Graph {
    const scale = 3
    const vertices: NodeList = []

    function posToNodeId(row: number, col: number): NodeId {
      return row * width + col
    }

    function nodeIdToPos(u: NodeId): [number, number] {
      const col = u % width
      const row = (u - col) / width
      return [row, col]
    }

    function isOdd(row: number): boolean {
      return row % 2 === 1
    }

    const shakeup = shakeUpNodePosition ? () => random.float(-0.5, 0.5) : () => 0

    for (let row = 0; row < height; row++) {
      const xOffset = shape === "triangle" && isOdd(row) ? scale / 2 : 0
      for (let col = 0; col < width; col++) {
        const nodeId: NodeId = posToNodeId(row, col)
        vertices.push({
          // id: nodeId,
          label: getNodeLabel(nodeId),
          coords: {
            x: col * scale - xOffset + shakeup(),
            y: row * scale + shakeup(),
          },
        })
      }
    }

    function getSquareNeighbors(u: NodeId): NodeId[] {
      const neighbors: NodeId[] = []

      const [row, col] = nodeIdToPos(u)

      if (col > 0) neighbors.push(posToNodeId(row, col - 1))
      if (row > 0) neighbors.push(posToNodeId(row - 1, col))
      if (col < width - 1) neighbors.push(posToNodeId(row, col + 1))
      if (row < height - 1) neighbors.push(posToNodeId(row + 1, col))

      return neighbors
    }

    function getTriangleNeighbors(u: NodeId): NodeId[] {
      const neighbors = getSquareNeighbors(u)

      const [row, col] = nodeIdToPos(u)

      if (isOdd(row) && col > 0) {
        if (row > 0) neighbors.push(posToNodeId(row - 1, col - 1))
        if (row < height - 1) neighbors.push(posToNodeId(row + 1, col - 1))
      } else if (!isOdd(row) && col < width - 1) {
        if (row > 0) neighbors.push(posToNodeId(row - 1, col + 1))
        if (row < height - 1) neighbors.push(posToNodeId(row + 1, col + 1))
      }

      return neighbors
    }

    // interpret 0 as left to right and 1 as right to left diagonal
    const diagonalDirections =
      shape === "square-width-diagonals" ? Array(width * (height - 1)).map(() => random.int(0, 1)) : []

    function getSquareWDiagonalsNeighbors(u: NodeId): NodeId[] {
      const neighbors: NodeId[] = getSquareNeighbors(u)

      const [row, col] = nodeIdToPos(u)

      if (row > 0) {
        if (col > 0 && diagonalDirections[posToNodeId(row - 1, col - 1)] === 1)
          neighbors.push(posToNodeId(row - 1, col - 1))
        if (col < width - 1 && diagonalDirections[posToNodeId(row - 1, col)] === 0)
          neighbors.push(posToNodeId(row - 1, col + 1))
      }

      if (row < height - 1) {
        if (col > 0 && diagonalDirections[posToNodeId(row, col - 1)] === 0)
          neighbors.push(posToNodeId(row + 1, col - 1))
        if (col < width - 1 && diagonalDirections[u] === 1) neighbors.push(posToNodeId(row + 1, col + 1))
      }

      return neighbors
    }

    const getPossibleNeighbors =
      shape === "triangle"
        ? getTriangleNeighbors
        : shape === "square-width-diagonals"
          ? getSquareWDiagonalsNeighbors
          : getSquareNeighbors

    // for undirected graphs, this prevents drawing edges twice
    const filteredPossibleNeighbors = directed
      ? getPossibleNeighbors
      : (u: NodeId) => getPossibleNeighbors(u).filter((i) => i > u)

    let numEdges = 0

    // add random edges to the graph
    const links: EdgeList = Array.from(Array(vertices.length), () => [])
    links.forEach((_, u: NodeId) => {
      filteredPossibleNeighbors(u).forEach((v: NodeId) => {
        if (random.bool(p)) {
          numEdges++
          RandomGraph.addEdge(u, v, directed, links)
        }
      })
    })

    if (ensureStronglyConnected)
      numEdges += RandomGraph.ensureConnectivity(
        width * height,
        links,
        getPossibleNeighbors,
        directed,
        random,
      )

    const graph = new Graph(vertices, links, directed, weights !== null)

    if (weights === null) return graph

    function* getWeight() {
      if (weights === "random") {
        while (true) {
          yield random.int(1, 20)
        }
      } else {
        const weightList = random.shuffle(Array.from(Array(numEdges), (_, i) => i + 1))
        for (const w of weightList) yield w
      }

      return 0
    }

    const weightGen = getWeight()

    for (let u: NodeId = 0; u < vertices.length; u++) {
      for (const { target: v } of graph.getNeighbors(u)) {
        if (directed || u < v) {
          const weight = weightGen.next().value
          graph.setEdgeWeight(u, v, weight)
        }
      }
    }

    return graph
  }

  /**
   * Adds the edge (u,v) to links.
   * @param u
   * @param v
   * @param directed
   * @param links is modified by the function
   * @param invert inverts the edge bevor adding it.
   * @private
   */
  private static addEdge(
    u: NodeId,
    v: NodeId,
    directed: boolean,
    links: EdgeList,
    invert: boolean = false,
  ): void {
    if (invert) [u, v] = [v, u]

    links[u].push({ source: u, target: v })
    if (!directed) links[v].push({ source: v, target: u })
  }

  /**
   * Ensures the graph to be strongly connected by finding connected components and adding random edges connecting the
   * components with respect to the possible neighbor function
   * @param numNodes
   * @param links
   * @param getPossibleNeighbors
   * @param directed
   * @param random
   * @private
   */
  private static ensureConnectivity(
    numNodes: number,
    links: EdgeList,
    getPossibleNeighbors: (u: NodeId) => NodeId[],
    directed: boolean,
    random: Random,
  ): number {
    const nodeIds = [...Array(numNodes).keys()]
    const nodes: NodeId[] = random.shuffle(nodeIds)
    let connected = false
    let currentNodeId = 0
    let numEdgesAdded = 0
    do {
      const { reachable, unreachable } = findReachableNodes(nodes[currentNodeId], numNodes, links)
      if (unreachable.length === 0) {
        connected = !directed || currentNodeId === numNodes - 1
        currentNodeId++
        continue
      }

      let a = reachable
      let b = unreachable
      let invertEdge = false
      if (reachable.length > unreachable.length) {
        ;[a, b] = [b, a]
        invertEdge = true
      }

      random.shuffle(a)

      for (const u of a) {
        const possibleNeighbors = getPossibleNeighbors(u).filter((v) => b.includes(v))
        if (possibleNeighbors.length === 0) continue
        RandomGraph.addEdge(u, random.choice(possibleNeighbors), directed, links, invertEdge)
        numEdgesAdded++
        break
      }
    } while (!connected)

    return numEdgesAdded
  }
}

function findReachableNodes(
  startNode: NodeId,
  numNodes: number,
  links: EdgeList,
): { reachable: NodeId[]; unreachable: NodeId[] } {
  const visited = Array(numNodes).fill(false) as boolean[]
  visited[startNode] = true
  // walk the graph in dfs order
  const todo: NodeId[] = [startNode]
  while (todo.length > 0) {
    const nextNode: NodeId = todo.pop() as NodeId
    for (const edge of links[nextNode]) {
      if (visited[edge.target]) continue

      todo.push(edge.target)
      visited[edge.target] = true
    }
  }

  const reachable: NodeId[] = []
  const unreachable: NodeId[] = []
  for (let i = 0; i < numNodes; i++) {
    if (visited[i]) reachable.push(i)
    else unreachable.push(i)
  }

  return { reachable, unreachable }
}

export const traversalStrategies = ["pre", "in", "post"] as const
type TraversalStrategies = (typeof traversalStrategies)[number]

export class RootedTree {
  root: string
  children: RootedTree[] // left to right
  coordinates: { x: number; y: number; mod: number; index: number; parent: RootedTree | null } = {
    x: 0,
    y: 0,
    mod: 0,
    index: 0,
    parent: null,
  }

  nodeDistX: number = 1
  nodeDistY: number = 1.5
  siblingDist: number = 0
  treeDist: number = 0

  constructor(root: string, children: RootedTree[] = []) {
    this.root = root
    this.children = children
  }

  public getNumNodes(): number {
    return this.children.reduce((acc: number, node: RootedTree) => acc + node.getNumNodes(), 1)
  }

  public getTraversalOrder(type: TraversalStrategies): string[] {
    let order: string[] = []
    if (type === "pre") {
      order.push(this.root)
      this.children.forEach((child) => {
        order = order.concat(child.getTraversalOrder(type))
      })
    } else if (type === "post") {
      this.children.forEach((child) => {
        order = order.concat(child.getTraversalOrder(type))
      })
      order.push(this.root)
    } else if (type === "in") {
      // Todo: this is not well defined for non-binary trees
      if (this.children.length > 0) order = order.concat(this.children[0].getTraversalOrder(type))
      order.push(this.root)
      for (let i = 1; i < this.children.length; i++) {
        order = order.concat(this.children[i].getTraversalOrder(type))
      }
    }

    return order
  }

  public static random(
    depth: number | { min: number; max: number },
    degree:
      | number
      | {
          min: number
          max: number
        },
    random: Random,
  ): RootedTree {
    const tree = RootedTree.rnd(depth, degree, random)
    const numNodes = tree.getNumNodes()
    let labels = []
    for (let i = 0; i < numNodes; i++) {
      labels.push(getNodeLabel(i))
    }
    labels = random.shuffle(labels)

    RootedTree.relable(tree, labels)
    return tree
  }

  private static rnd(
    depth: number | { min: number; max: number },
    degree:
      | number
      | {
          min: number
          max: number
        },
    random: Random,
  ): RootedTree {
    // assert(typeof depth === "number" || depth.min < depth.max)

    if (typeof depth !== "number" && depth.min === 0) depth = random.int(depth.min, depth.max)

    if (depth === 0) return new RootedTree("", [])

    const newDepth = typeof depth === "number" ? depth - 1 : { min: depth.min - 1, max: depth.max - 1 }
    const children: RootedTree[] = []
    const numChildren = typeof degree === "number" ? degree : random.int(degree.min, degree.max)
    for (let i = 0; i < numChildren; i++) {
      children.push(RootedTree.rnd(newDepth, degree, random))
    }

    return new RootedTree("", children) //{ root: "", children: children }
  }

  private static relable(tree: RootedTree, labels: string[]): void {
    if (labels.length === 0) throw new Error("Not enough labels")
    tree.root = labels.pop()! // pop cannot return undefined since the array is not empty at this point

    for (let i = 0; i < tree.children.length; i++) {
      this.relable(tree.children[i], labels)
    }
  }

  public toGraph(): Graph {
    const nodes: NodeList = []
    const edges: EdgeList = []

    this.computeNodeCoordinates()
    this.collectNodesAndEdges(nodes, edges)

    return new Graph(nodes, edges, false, false)
  }

  private collectNodesAndEdges(
    nodes: NodeList,
    edges: EdgeList,
    parentNodeId: number | null = null,
  ): void {
    const currentNodeId = nodes.length
    nodes.push({ label: this.root, coords: { x: this.coordinates.x, y: this.coordinates.y } })
    edges.push([])

    if (parentNodeId !== null) {
      edges[parentNodeId].push({ source: parentNodeId, target: currentNodeId })
    }

    this.children.forEach((child) => {
      child.collectNodesAndEdges(nodes, edges, currentNodeId)
    })
  }

  /**
   * Reingold-Tilford algorithm for laying out trees.
   */
  private computeNodeCoordinates() {
    this.initCoordinateComputation()
    this.computeInitialX()
    this.computeFinalNodeCoordinates()
  }

  /**
   * Initializes the coordinates object for each node. It links each node with its parent and tells it
   * its index in the parents child array. The depth is already set to the correct value.
   */
  private initCoordinateComputation(
    depth: number = 0,
    index: number = 0,
    parent: RootedTree | null = null,
  ): void {
    this.coordinates = { x: 0, y: depth, mod: 0, index: index, parent: parent }

    this.children.forEach((child, i) => {
      child.initCoordinateComputation(depth + 1, i, this)
    })
  }

  /**
   * Computes initial x values for each node.
   */
  private computeInitialX(): void {
    this.children.forEach((child) => {
      child.computeInitialX()
    })

    // if this node is a leaf
    if (this.children.length === 0) {
      if (this.coordinates.index > 0) {
        // place the node just right of its left sibling
        this.coordinates.x = this.getPreviousSiblingX() + this.nodeDistX + this.siblingDist
        this.checkForOverlappingSubtrees()
      }
      // else x = 0 (initialization value)
    } else {
      // place the node in the center over its children
      const center =
        (this.children[0].coordinates.x + this.children[this.children.length - 1].coordinates.x) * 0.5

      if (this.coordinates.index === 0) {
        this.coordinates.x = center
      } else {
        this.coordinates.x = this.getPreviousSiblingX() + this.nodeDistX + this.siblingDist
        this.coordinates.mod = this.coordinates.x - center
      }

      if (this.coordinates.index > 0) this.checkForOverlappingSubtrees()
    }
  }

  private checkForOverlappingSubtrees(): void {
    const minDistance = this.treeDist + this.nodeDistX
    let shiftValue = 0

    const nodeContour = this.getLeftContour()

    // check against all siblings to the left
    for (let i = 0; i < this.coordinates.index; i++) {
      // since the node has siblings it also has a parent.
      const sibling = this.coordinates.parent!.children[i]
      const siblingContour = sibling.getRightContour()

      for (
        let y = this.coordinates.y + 1;
        y <=
        Math.min(
          Math.max(...Object.keys(nodeContour).map(Number)),
          Math.max(...Object.keys(siblingContour).map(Number)),
        );
        y++
      ) {
        const dist = nodeContour[y] - siblingContour[y]
        shiftValue = Math.max(shiftValue, minDistance - dist)
      }
    }

    // apply shift once, after all siblings considered
    if (shiftValue > 0) {
      this.coordinates.x += shiftValue
      this.coordinates.mod += shiftValue

      // pass the *last left sibling* (closest one) to centerNodes
      const leftSibling = this.coordinates.parent!.children[this.coordinates.index - 1]
      this.centerNodes(leftSibling)
    }
  }

  private centerNodes(leftSibling: RootedTree): void {
    const leftIndex = leftSibling.coordinates.index
    const rightIndex = this.coordinates.index
    const nodeSpan = rightIndex - leftIndex - 1

    if (nodeSpan > 0) {
      const nodeDist = (this.coordinates.x - leftSibling.coordinates.x) / (nodeSpan + 1)

      for (let i = 1; i <= nodeSpan; i++) {
        const middleNode = this.coordinates.parent!.children[leftIndex + i] // since the node has siblings it has a parent
        const offset = leftSibling.coordinates.x + nodeDist * i - middleNode.coordinates.x
        middleNode.coordinates.x += offset
        middleNode.coordinates.mod += offset
      }

      this.checkForOverlappingSubtrees() // todo is this correct?
    }
  }

  private getLeftContour(): Record<number, number> {
    const contours = {}
    this.getContour(0, contours, Math.min)
    return contours
  }

  private getRightContour(): Record<number, number> {
    const contours = {}
    this.getContour(0, contours, Math.max)
    return contours
  }

  private getContour(
    modSum: number,
    contours: Record<number, number>,
    m: (a: number, b: number) => number,
  ): void {
    contours[this.coordinates.y] = m(
      contours[this.coordinates.y] ?? this.coordinates.x + modSum,
      this.coordinates.x + modSum,
    )

    modSum += this.coordinates.mod
    this.children.forEach((child) => {
      child.getContour(modSum, contours, m)
    })
  }

  private getPreviousSiblingX(): number {
    if (this.coordinates.index > 0)
      return this.coordinates.parent!.children[this.coordinates.index - 1].coordinates.x // since the nod has siblings it has a parent

    return 0
  }

  private computeFinalNodeCoordinates(modSum: number = 0) {
    this.coordinates.x += modSum
    this.coordinates.y *= this.nodeDistY
    modSum += this.coordinates.mod

    this.children.forEach((child) => child.computeFinalNodeCoordinates(modSum))
  }
}

function addEdge(
  edges: EdgeList,
  source: NodeId,
  target: NodeId,
  weight: number | undefined,
  directed: boolean,
  ensureBidirectional: boolean,
  random: Random,
): void {
  edges[source].push({ source, target, value: weight })

  if (directed) {
    if (ensureBidirectional || random.bool(0.5)) {
      edges[target].push({ source: target, target: source, value: weight })
    }
  } else {
    edges[target].push({ source: target, target: source, value: weight })
  }
}

function centerPartition(nodes: NodeList, partitionSize: number, totalSize: number): void {
  const offset = ((totalSize - partitionSize) * 2) / 2
  for (let i = 0; i < partitionSize; i++) {
    nodes[i].coords.x += offset
  }
}

export class KNMGraphGenerator {
  public static completeGraph(
    random: Random,
    size: number,
    weights: "random" | "unique" | null,
    directed: boolean = false,
    ensureBidirectional: boolean = false,
  ): Graph {
    const nodes: NodeList = []
    const edges: EdgeList = Array.from(Array(size), () => [])

    // calculate radius
    const minDistance = 2
    const radius = Math.max(minDistance / (2 * Math.sin(Math.PI / size)), 5) // fallback minimum

    for (let i = 0; i < size; i++) {
      const angle = (2 * Math.PI * i) / size
      nodes.push({
        label: getNodeLabel(i),
        coords: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
      })
    }

    // connect nodes
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        const weight = weights === "random" ? random.int(1, 20) : i + j
        addEdge(edges, i, j, weight, directed, ensureBidirectional, random)
      }
    }

    return new Graph(nodes, edges, directed, !!weights)
  }

  public static bipartiteGraph(
    random: Random,
    nodesInPartA: number,
    nodesInPartB: number,
    weights: "random" | "unique" | null,
    directed: boolean = false,
    ensureBidirectional: boolean = false,
    edgeProbability: number = 1.0, // Default: complete bipartite graph
  ): Graph {
    const nodes: NodeList = []
    const edges: EdgeList = Array.from(Array(nodesInPartA + nodesInPartB), () => [])
    const yOffset = 3

    // create partitions
    for (let i = 0; i < nodesInPartA; i++) {
      nodes.push({ label: getNodeLabel(i), coords: { x: i * 2, y: -yOffset } })
    }
    for (let j = 0; j < nodesInPartB; j++) {
      nodes.push({ label: getNodeLabel(nodesInPartA + j), coords: { x: j * 2, y: yOffset } })
    }

    centerPartition(nodes.slice(0, nodesInPartA), nodesInPartA, nodesInPartA + nodesInPartB)
    centerPartition(nodes.slice(nodesInPartA), nodesInPartB, nodesInPartA + nodesInPartB)

    for (let a = 0; a < nodesInPartA; a++) {
      for (let b = nodesInPartA; b < nodesInPartA + nodesInPartB; b++) {
        if (random.bool(edgeProbability)) {
          // add edge with probability
          const weight = weights === "random" ? random.int(1, 20) : a + b
          addEdge(edges, a, b, weight, directed, ensureBidirectional, random)
        }
      }
    }

    return new Graph(nodes, edges, directed, !!weights)
  }
}

export class CycleGraph {
  public static generate(
    random: Random,
    size: number,
    weights: "random" | "unique" | null,
    directed: boolean = false,
    shakeUpNodePosition: boolean = false,
    ensureBidirectional: boolean = false,
  ): Graph {
    const nodes: NodeList = []
    const edges: EdgeList = Array.from(Array(size), () => [])

    // calculate radius
    const minDistance = 2
    const radius = Math.max(minDistance / (2 * Math.sin(Math.PI / size)), 5) // fallback minimum

    const shakeup = shakeUpNodePosition ? () => random.float(-0.5, 0.5) : () => 0

    for (let i = 0; i < size; i++) {
      const angle = (2 * Math.PI * i) / size
      nodes.push({
        label: getNodeLabel(i),
        coords: {
          x: Math.cos(angle) * radius + shakeup(),
          y: Math.sin(angle) * radius + shakeup(),
        },
      })
    }

    // connect nodes
    for (let i = 0; i < size; i++) {
      const next = (i + 1) % size
      const weight = weights === "random" ? random.int(1, 20) : i + 1

      addEdge(edges, i, next, weight, directed, ensureBidirectional, random)
    }

    return new Graph(nodes, edges, directed, !!weights)
  }
}

/**
 * Checks if two edges are the same (ignoring direction)
 * @param a
 * @param b
 */
export function isSameEdge(a: Edge, b: Edge): boolean {
  return (
    (a.source === b.source && a.target === b.target) || (a.source === b.target && a.target === b.source)
  )
}
