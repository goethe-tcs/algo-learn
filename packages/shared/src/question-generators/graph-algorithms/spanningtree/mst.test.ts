import { describe, expect, test } from "vitest"
import {
  computeAllMST,
  getAllMST,
} from "@shared/question-generators/graph-algorithms/spanningtree/primAlgo.ts"
import { Graph, type Edge, type Node } from "@shared/utils/graph.ts"

describe("MST Weight Test", () => {
  test("1", () => {
    const g1 = getGraph1()
    const primResult = computeAllMST(g1, g1.nodes[0])
    expect(primResult[0].mst.reduce((acc, edge) => acc + (edge.value ?? 1), 0)).toEqual(43)
  })
  test("2", () => {
    const g2 = getGraph2()
    const primResult = computeAllMST(g2, g2.nodes[0])
    expect(primResult[0].mst.reduce((acc, edge) => acc + (edge.value ?? 1), 0)).toEqual(39)
  })
  test("3", () => {
    const g3 = getGraph3()
    const primResult = computeAllMST(g3, g3.nodes[0])
    expect(primResult[0].mst.reduce((acc, edge) => acc + (edge.value ?? 1), 0)).toEqual(3)
  })
})

describe("Prim Order (Unique MST)", () => {
  test("1", () => {
    const g1 = getGraph1()
    const primResult = computeAllMST(g1, g1.nodes[0])
    expect(primResult[0].nodes.map((x) => x.label!).join("")).toEqual("AGECHBIFD")
  })
  test("2", () => {
    const g2 = getGraph2()
    const primResult = computeAllMST(g2, g2.nodes[0])
    expect(primResult[0].nodes.map((x) => x.label!).join("")).toEqual("ADCJIBHFGE")
  })
  test("3", () => {
    const g3 = getGraph3()
    const primResult = computeAllMST(g3, g3.nodes[0])
    expect(
      primResult.some((result) => result.nodes.map((x) => x.label!).join("") === "ACDB"),
    ).toBeTruthy()
  })
})

describe("getAllMST (Number of Unique MSTs)", () => {
  test("3", () => {
    const g3 = getGraph3()
    const primResult = getAllMST(g3)
    expect(primResult.length).toEqual(16)
  })
})

function getGraph1() {
  // https://ae.cs.uni-frankfurt.de/teaching/20ss/+algo1/selbsttest11_lsg.pdf
  // Exercise 1
  const nodes: Node[] = "ABCDEFGHI".split("").map((label) => ({
    label,
    coords: { x: 0, y: 0 },
  }))

  const edges: Edge[] = [
    [3, 5, 12],
    [5, 8, 9],
    [3, 7, 13],
    [5, 2, 12],
    [8, 1, 9],
    [7, 2, 8],
    [2, 1, 10],
    [7, 0, 8],
    [2, 6, 13],
    [2, 4, -1],
    [1, 4, 13],
    [0, 6, -1],
    [6, 4, -3],
  ].flatMap(([x, y, value]) => [
    { source: x, target: y, value },
    { source: y, target: x, value },
  ])

  return new Graph(nodes, [edges], false, false)
}

function getGraph2() {
  // https://ae.cs.uni-frankfurt.de/teaching/20ss/+algo1/selbsttest11_lsg.pdf
  // Exercise 2
  const nodes: Node[] = "ABCDEFGHIJ".split("").map((label) => ({
    label,
    coords: { x: 0, y: 0 },
  }))

  const edges: Edge[] = [
    [7, 6, 8],
    [9, 0, 15],
    [7, 1, 1],
    [6, 1, 13],
    [6, 2, 10],
    [9, 2, 4],
    [9, 3, 6],
    [0, 3, 5],
    [1, 2, 9],
    [2, 3, -1],
    [1, 8, 0],
    [2, 8, 5],
    [2, 4, 14],
    [3, 4, 10],
    [8, 4, 15],
    [8, 5, 7],
    [4, 5, 10],
  ].flatMap(([x, y, value]) => [
    { source: x, target: y, value },
    { source: y, target: x, value },
  ])

  return new Graph(nodes, [edges], false, false)
}

function getGraph3() {
  // Complete Graph with 4 nodes and all equal weights
  const nodes: Node[] = "ABCD".split("").map((label) => ({
    label,
    coords: { x: 0, y: 0 },
  }))

  const edges: Edge[] = [
    [0, 1, 1],
    [0, 2, 1],
    [0, 3, 1],
    [1, 2, 1],
    [1, 3, 1],
    [2, 3, 1],
  ].flatMap(([x, y, value]) => [
    { source: x, target: y, value },
    { source: y, target: x, value },
  ])

  return new Graph(nodes, [edges], false, false)
}
