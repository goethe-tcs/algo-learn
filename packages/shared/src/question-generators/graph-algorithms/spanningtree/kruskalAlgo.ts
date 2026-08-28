import { QuickFind } from "@shared/question-generators/unionFind/quickFind/quickFindAlgorithm.ts"
import type { Edge, Graph } from "@shared/utils/graph.ts"

export function kruskalAlgorithm(graph: Graph): { mst: Edge[]; cycle: Edge[] } {
  spanningTreeBaseChecks(graph)
  const mst: Edge[] = []
  const cycle: Edge[] = []
  const unionFind = new QuickFind(graph.nodes.length)
  const sortedEdges = graph.edges.flat().sort((a, b) => (a.value ?? 1) - (b.value ?? 1))

  const seen = new Set<string>()
  const uniqueEdges = sortedEdges.filter(({ source, target, value }) => {
    const key = source < target ? `${source}-${target}-${value}` : `${target}-${source}-${value}`

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const edge of uniqueEdges) {
    if (unionFind.find(edge.source) !== unionFind.find(edge.target)) {
      mst.push(edge)
      unionFind.union(edge.source, edge.target)
    } else {
      cycle.push(edge)
    }
    if (mst.length === graph.nodes.length - 1) {
      return { mst, cycle }
    }
  }
  throw new Error(
    "The algorithm was not able to compute a spanning tree. The graph might not be connected.",
  )
}

export function spanningTreeBaseChecks(graph: Graph) {
  if (graph.nodes.length === 0) {
    throw new Error("The graph has no nodes.")
  }
  if (graph.edges.length === 0) {
    throw new Error("The graph has no edges.")
  }
  if (graph.directed) {
    throw new Error("Prim and Kruskal only work on undirected graphs.")
  }
}
