import { describe, expect, test } from "vitest"
import Random from "@shared/utils/random"
import { Graph, RandomGraph, RootedTree, type Edge } from "./graph.ts"

test("parse", () => {
  const graphStr = '3 3 1 1 1 0 0 6 4\n1 0 3 "A"\n0 1 4 "B"\n1 1 5 "C"\n0 1 1 1\n1 2 2 2\n2 0 3 3\n'
  const graph = Graph.parse(graphStr)

  expect(graph.getNumNodes()).toEqual(3)
  // correct edges
  expect(graph.getNumEdges()).toEqual(3)
  expect(() => graph.getEdge(0, 2)).toThrowError()
  expect(() => graph.getEdge(0, 1)).not.toThrowError()
  expect(() => graph.getEdge(1, 2)).not.toThrowError()
  expect(() => graph.getEdge(2, 0)).not.toThrowError()
  // correct labels
  expect(graph.nodes[0].label).toEqual("A")
  expect(graph.nodes[1].label).toEqual("B")
  expect(graph.nodes[2].label).toEqual("C")
  // correct groups
  expect(graph.nodes[0].group).toEqual(3)
  expect(graph.nodes[1].group).toEqual(4)
  expect(graph.nodes[2].group).toEqual(5)

  expect(graph.toString()).toEqual(graphStr)
  expect(graph.isStronglyConnected()).toBeTruthy()
})

describe("graph generation", () => {
  function getGraph({
    seed = "test",
    width = 4,
    height = 5,
    p = 0.1,
    shape = "square",
    weightType = "unique",
    directed = true,
    connected = false,
  }: {
    seed?: string
    width?: number
    height?: number
    p?: number
    shape?: "square" | "square-width-diagonals" | "triangle"
    weightType?: "unique" | "random" | null
    directed?: boolean
    connected?: boolean
  } = {}) {
    const random = new Random(seed)
    return RandomGraph.grid(random, [width, height], p, shape, weightType, directed, false, connected)
  }

  test("random grid graph", () => {
    const width = 5
    const height = 6
    const graph = getGraph({ width, height })
    expect(graph.nodes.length).toEqual(width * height)

    const edgeListToWeightList = (edges: Edge[]) => edges.map((e: Edge) => e.value)
    const edgeWeights = graph.edges.reduce(
      (weightList, edges) => weightList.concat(edgeListToWeightList(edges)),
      [] as (number | undefined)[],
    )

    expect(edgeWeights).toEqual([...new Set(edgeWeights)])
  })

  test("undirected weights", () => {
    const graph = getGraph({ directed: false })
    for (const edges of graph.edges) {
      for (const e of edges) {
        expect(e.value).toEqual(graph.getEdge(e.target, e.source).value)
      }
    }
  })

  describe("connected graph", () => {
    test("undirected", () => {
      const graph = getGraph({ p: 0.1, directed: false, connected: false })
      expect(graph.isStronglyConnected()).toBeFalsy()

      const graph2 = getGraph({ p: 0.1, directed: false, connected: true })
      expect(graph2.isStronglyConnected()).toBeTruthy()
    })

    test("directed", () => {
      const graph = getGraph({ p: 0.1, directed: true, connected: false })
      expect(graph.isStronglyConnected()).toBeFalsy()

      const graph2 = getGraph({ p: 0.1, directed: true, connected: true })
      expect(graph2.isStronglyConnected()).toBeTruthy()
    })
  })
})

describe("tree traversal", () => {
  const tree = new RootedTree("a", [new RootedTree("b"), new RootedTree("c")])

  test("preorder", () => {
    expect(tree.getTraversalOrder("pre")).toEqual(["a", "b", "c"])
  })

  test("inorder", () => {
    expect(tree.getTraversalOrder("in")).toEqual(["b", "a", "c"])
  })

  test("postorder", () => {
    expect(tree.getTraversalOrder("post")).toEqual(["b", "c", "a"])
  })
})
