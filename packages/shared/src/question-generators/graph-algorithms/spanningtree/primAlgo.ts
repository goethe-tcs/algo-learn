import { spanningTreeBaseChecks } from "@shared/question-generators/graph-algorithms/spanningtree/kruskalAlgo.ts"
import { isSameEdge, type Edge, type Graph, type Node } from "@shared/utils/graph.ts"

export function getNumOfAllMST(graph: Graph) {
  return getAllMST(graph).length
}

export function getAllMST(graph: Graph) {
  const result: { mst: Edge[]; nodes: Node[] }[] = []
  for (const node of graph.nodes) {
    const allMSTNode = computeAllMST(graph, node)
    result.push(...allMSTNode)
  }
  return filterDuplicates(result)
}

export function computeAllMST(graph: Graph, startNode: Node): { mst: Edge[]; nodes: Node[] }[] {
  spanningTreeBaseChecks(graph)
  if (!checkNodeIncluded(graph, startNode)) {
    throw new Error(`Start node ${startNode.label} not found in the graph.`)
  }
  const startNodeIndex: number = graph.nodes.findIndex((node) => node.label === startNode.label)
  let result: { mst: Edge[]; nodes: Node[]; seen?: Set<number> }[] = [
    { mst: [], nodes: [startNode], seen: new Set<number>([startNodeIndex]) },
  ]
  while (result.some((x) => x.mst.length < graph.getNumNodes() - 1)) {
    const newResults: { mst: Edge[]; nodes: Node[]; seen: Set<number> }[] = []
    while (result.length > 0) {
      const currentResult = result.pop()
      if (!currentResult) continue
      if (currentResult.mst.length === graph.getNumNodes() - 1) continue
      let edgeOptions = graph.edges
        .flat()
        .filter(
          (edge) => currentResult.seen?.has(edge.source) && !currentResult.seen?.has(edge.target),
          // (!currentResult.seen.has(edge.source) && currentResult.seen.has(edge.target)),
        )
        .sort((a, b) => (a.value ?? 1) - (b.value ?? 1))
      if (edgeOptions.length === 0) {
        throw new Error(
          "The algorithm was not able to compute a spanning tree. The graph might not be connected.",
        )
      }
      edgeOptions = edgeOptions.filter((e) => (e.value ?? 1) <= (edgeOptions[0].value ?? 1))
      for (const edgeOption of edgeOptions) {
        // copy the current result
        const newResult = {
          mst: [...currentResult.mst],
          nodes: [...currentResult.nodes],
          seen: new Set<number>(currentResult.seen),
        }
        newResult.mst.push(edgeOption)
        const nextNode = currentResult.seen?.has(edgeOption.source)
          ? edgeOption.target
          : edgeOption.source
        newResult.nodes.push(graph.nodes[nextNode])
        newResult.seen.add(nextNode)
        newResults.push(newResult)
      }
    }
    result = filterDuplicates(newResults)
  }
  return filterDuplicates(result)
}

export function filterDuplicates(
  data: { mst: Edge[]; nodes: Node[]; seen?: Set<number> }[],
): { mst: Edge[]; nodes: Node[]; seen?: Set<number> }[] {
  const result: { mst: Edge[]; nodes: Node[]; seen?: Set<number> }[] = []
  for (const d of data) {
    if (!result.some((x) => isSameMST(x, d))) {
      result.push(d)
    }
  }
  return result
}

function isSameMST(a: { mst: Edge[]; nodes: Node[] }, b: { mst: Edge[]; nodes: Node[] }): boolean {
  if (a.mst.length !== b.mst.length) return false
  for (const edge of a.mst) {
    if (!b.mst.some((x) => isSameEdge(x, edge))) return false
  }
  return true
}

function checkNodeIncluded(graph: Graph, node: Node): boolean {
  return graph.nodes.some((x) => x.label === node.label)
}
