import { QuickFind } from "@shared/question-generators/unionFind/quickFind/quickFindAlgorithm.ts"
import type { Edge } from "@shared/utils/graph.ts"

/**
 * Checks if a given list of edges forms a spanning tree
 * @param numNodes
 * @param edges
 */
export function isSpanningTree(numNodes: number, edges: Edge[]): boolean {
  const nodes = new Set<number>()
  for (const edge of edges) {
    nodes.add(edge.source)
    nodes.add(edge.target)
  }
  if (nodes.size !== numNodes) return false

  const qf = new QuickFind(numNodes)
  for (const edge of edges) {
    if (qf.find(edge.source) === qf.find(edge.target)) return false // cycle
    qf.union(edge.source, edge.target)
  }

  return true
}
