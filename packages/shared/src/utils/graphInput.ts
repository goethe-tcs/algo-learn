import type { Language } from "@shared/api/Language.ts"
import { getNodeLabel, type Edge, type Graph, type NodeList } from "@shared/utils/graph.ts"
import { t, type Translations } from "@shared/utils/translations.ts"

type GraphElementStateType = { selected: boolean; group: null | number }

export type NodeInputSelectedCheckResult = { parsed: boolean; messages: string[]; selected: string[] }
export type NodeInputGroupCheckResult = {
  parsed: boolean
  messages: string[]
  groups: { [key: number]: string[] }
}
export type NodeInputCheckResult = NodeInputSelectedCheckResult | NodeInputGroupCheckResult

export type EdgeInputSelectedCheckResult = {
  parsed: boolean
  messages: string[]
  selected: [string, string][]
}
export type EdgeInputGroupCheckResult = {
  parsed: boolean
  messages: string[]
  groups: { [key: number]: [string, string][] }
}
export type EdgeInputCheckResult = EdgeInputSelectedCheckResult | EdgeInputGroupCheckResult

const parseFdTranslations: Translations = {
  en: {
    validNodeName: `**{{0}}** is not a valid node label.`,
    validGroup: `**{{0}}** is not a valid group.`,
    edgeFormat: `**{{0}}** Invalid edge format.`,
    selfLoop: "No self loops allowed.",
    edgeNodeMissing: "Edge connects a node that is not in the graph",
    edgeMissing: "Edge does not exist in the graph.",
  },
  de: {
    validNodeName: `**{{0}}** ist kein gültiger Knotenname.`,
    validGroup: `**{{0}}** ist keine gültige Gruppe.`,
    edgeFormat: "{{0}}: Ungültiges Kantenformat.",
    selfLoop: "Keine Schleifen erlaubt.",
    edgeNodeMissing: "Die Kante verbindet einen Knoten, der nicht im Graphen existiert.",
    edgeMissing: "Die Kante existiert nicht im Graphen.",
  },
}

export function updateGraphNodeSelected(graph: Graph, nodeList: NodeList, selected: string[]) {
  for (let i = 0; i < graph.nodes.length; i++) {
    nodeList[i].group = selected.includes(graph.nodes[i].label!) ? 1 : null
  }
}

export function updateGraphNodeGroup(
  graph: Graph,
  nodeList: NodeList,
  groups: { [key: number]: string[] },
) {
  for (let i = 0; i < graph.nodes.length; i++) {
    nodeList[i].group = null
  }

  for (const [group, nodes] of Object.entries(groups)) {
    for (const node of nodes) {
      const nodeIndex = graph.nodes.findIndex((n) => n.label === node)
      if (nodeIndex !== -1) {
        nodeList[nodeIndex].group = parseInt(group) - 1
      }
    }
  }
}

export function updateGraphEdgeSelected(
  directed: boolean,
  edgeListFlat: Edge[],
  selected: [string, string][],
) {
  for (let i = 0; i < edgeListFlat.length; i++) {
    if (directed) {
      edgeListFlat[i].group =
        selected.findIndex(
          (edge) =>
            getNodeLabel(edgeListFlat[i].source) === edge[0] &&
            getNodeLabel(edgeListFlat[i].target) === edge[1],
        ) !== -1
          ? 1
          : null
    } else {
      edgeListFlat[i].group =
        selected.findIndex(
          (edge) =>
            getNodeLabel(edgeListFlat[i].source) === edge[0] &&
            getNodeLabel(edgeListFlat[i].target) === edge[1],
        ) !== -1 ||
        selected.findIndex(
          (edge) =>
            getNodeLabel(edgeListFlat[i].target) === edge[0] &&
            getNodeLabel(edgeListFlat[i].source) === edge[1],
        ) !== -1
          ? 1
          : null
    }
  }
}

export function updateGraphEdgeGroup(
  directed: boolean,
  edgeListFlat: Edge[],
  group: { [key: number]: [string, string][] },
) {
  for (let i = 0; i < edgeListFlat.length; i++) {
    edgeListFlat[i].group = null
  }

  for (const [groupIndex, edges] of Object.entries(group)) {
    for (const edge of edges) {
      let edgeIndex: number
      if (directed) {
        edgeIndex = edgeListFlat.findIndex(
          (e) => getNodeLabel(e.source) === edge[0] && getNodeLabel(e.target) === edge[1],
        )
      } else {
        edgeIndex = edgeListFlat.findIndex(
          (e) =>
            (getNodeLabel(e.source) === edge[0] && getNodeLabel(e.target) === edge[1]) ||
            (getNodeLabel(e.target) === edge[0] && getNodeLabel(e.source) === edge[1]),
        )
      }
      if (edgeIndex !== -1) {
        edgeListFlat[edgeIndex].group = parseInt(groupIndex) - 1
      }
    }
  }
}

/**
 * Function parsing the node input fields and checking for correct input
 * Node-String format is either (Node, Group) or Node seperated by ";"
 *
 * @param nodeString
 * @param graph
 * @param lang
 */
export function checkNodeInput(nodeString: string, graph: Graph, lang: Language): NodeInputCheckResult {
  const nodes = nodeString.toUpperCase().split(";")
  return graph.nodeClickType === "select" || graph.nodeClickType === "selectupgrade"
    ? checkNodeInputSelect(nodes, graph, lang)
    : checkNodeInputGroup(nodes, graph, lang)
}

/**
 * Checks the input of nodes if the graph nodes can only be selected
 * Checks:
 *  - Input contains only uppercase letters
 *  - Input contains only nodes that are in the graph
 * @param nodes
 * @param graph
 * @param lang
 */
function checkNodeInputSelect(
  nodes: string[],
  graph: Graph,
  lang: Language,
): NodeInputSelectedCheckResult {
  const selected: string[] = []
  const messages: string[] = []
  let parsed: boolean = true
  for (const node of nodes) {
    const cleanNode = node.replace(/\s/g, "")
    if (!cleanNode) continue
    if (!/^[A-Z]+$/.test(cleanNode)) {
      parsed = false
      messages.push(t(parseFdTranslations, lang, "validNodeName", [cleanNode]))
      continue
    }
    if (graph.nodes.findIndex((n) => n.label === cleanNode) === -1) {
      parsed = false
      messages.push(t(parseFdTranslations, lang, "validNodeName", [cleanNode]))
      continue
    }
    selected.push(cleanNode)
  }
  return { parsed, messages, selected }
}

function checkNodeInputGroup(nodes: string[], graph: Graph, lang: Language): NodeInputGroupCheckResult {
  const regexNodeGroup = new RegExp(`^\\(([A-Z]+),(\\d|[0-9])\\)+$`)
  const groups: { [key: number]: string[] } = {}
  const messages: string[] = []
  let parsed: boolean = true
  for (const node of nodes) {
    const cleanNode = node.replace(/\s/g, "")
    if (!cleanNode) continue

    const match = cleanNode.match(regexNodeGroup)
    if (!match || graph.nodes.findIndex((n) => n.label === match[1]) === -1) {
      parsed = false
      messages.push(t(parseFdTranslations, lang, "validNodeName", [cleanNode]))
      continue
    }

    const group = parseInt(match[2])
    const groupIndex = group - 1
    if (groupIndex > graph.nodeGroupMax || groupIndex < 1) {
      parsed = false
      messages.push(t(parseFdTranslations, lang, "validGroup", [group.toString()]))
    }

    groups[group] = groups[group] || []
    groups[group].push(match[1])
  }

  return { parsed, messages, groups }
}

/**
 * Function parsing the edge input fields and checking for correct input
 * @param edgeString
 * @param graph
 * @param lang
 */
export function checkEdgeInput(edgeString: string, graph: Graph, lang: Language): EdgeInputCheckResult {
  const edges = (edgeString ?? "").toUpperCase().split(";")
  return graph.edgeClickType === "select" || graph.edgeClickType === "selectupgrade"
    ? checkEdgeInputSelect(edges, graph, lang)
    : checkEdgeInputGroup(edges, graph, lang)
}

function checkEdgeCorrectness(
  match: RegExpMatchArray | null,
  edge: string,
  graph: Graph,
  lang: Language,
): { parsed: boolean; message: string } {
  if (!match) return { parsed: false, message: t(parseFdTranslations, lang, "edgeFormat", [edge]) }
  if (match[1] === match[2]) return { parsed: false, message: t(parseFdTranslations, lang, "selfLoop") }
  if (
    graph.nodes.findIndex((n) => n.label === match[1]) === -1 ||
    graph.nodes.findIndex((n) => n.label === match[2]) === -1
  ) {
    return { parsed: false, message: t(parseFdTranslations, lang, "edgeNodeMissing") }
  }
  // check if the edge exists
  if (graph.directed) {
    if (
      graph.edges
        .flat()
        .findIndex((e) => getNodeLabel(e.source) === match[1] && getNodeLabel(e.target) === match[2]) ===
      -1
    ) {
      return { parsed: false, message: t(parseFdTranslations, lang, "edgeMissing") }
    }
  } else {
    if (
      graph.edges
        .flat()
        .findIndex(
          (e) =>
            (getNodeLabel(e.source) === match[1] && getNodeLabel(e.target) === match[2]) ||
            (getNodeLabel(e.source) === match[2] && getNodeLabel(e.target) === match[1]),
        ) === -1
    ) {
      return { parsed: false, message: t(parseFdTranslations, lang, "edgeMissing") }
    }
  }
  return { parsed: true, message: "" }
}

function checkEdgeInputSelect(
  edges: string[],
  graph: Graph,
  lang: Language,
): EdgeInputSelectedCheckResult {
  const selected: [string, string][] = []
  const messages: string[] = []
  let parsed: boolean = true
  for (const edge of edges) {
    const cleanEdge = edge.replace(/\s/g, "")
    if (!cleanEdge) continue
    const regexEdge = new RegExp(`^\\(([A-Z]+),([A-Z]+)\\)$`)
    const match = cleanEdge.match(regexEdge)
    const edgeCorrectness = checkEdgeCorrectness(match, cleanEdge, graph, lang)
    if (!edgeCorrectness.parsed) {
      messages.push(edgeCorrectness.message)
      parsed = false
      continue
    }
    selected.push([match![1], match![2]])
  }
  return { parsed, messages, selected }
}

function checkEdgeInputGroup(edges: string[], graph: Graph, lang: Language): EdgeInputGroupCheckResult {
  const groups: { [key: number]: [string, string][] } = {}
  const messages: string[] = []
  let parsed: boolean = true
  for (const edge of edges) {
    const cleanEdge = edge.replace(/\s/g, "")
    if (!cleanEdge) continue
    const regexEdge = new RegExp(`^\\(([A-Z]+),([A-Z]+),(\\d|[0-9])\\)$`)
    const match = cleanEdge.match(regexEdge)
    const edgeCorrectness = checkEdgeCorrectness(match, cleanEdge, graph, lang)
    if (!edgeCorrectness.parsed) {
      messages.push(edgeCorrectness.message)
      parsed = false
      continue
    }
    const group = parseInt(match![3])
    const groupIndex = group - 1
    if (groupIndex > graph.edgeGroupMax || groupIndex < 0) {
      parsed = false
      messages.push(t(parseFdTranslations, lang, "validGroup", [group.toString()]))
      continue
    }
    groups[groupIndex] = groups[groupIndex] || []
    groups[groupIndex].push([match![1], match![2]])
  }
  return { parsed, messages, groups }
}

export function parseEdgeText(edgeListFlat: Edge[], graph: Graph) {
  return edgeListFlat
    .map((edge, i) =>
      edge.group !== null && graph.edgeClickType === "group"
        ? `(${getNodeLabel(edgeListFlat[i].source)},${getNodeLabel(edgeListFlat[i].target)},${(edge.group! + 1).toString()})`
        : edge.group !== null && graph.edgeClickType === "select"
          ? `(${getNodeLabel(edgeListFlat[i].source)},${getNodeLabel(edgeListFlat[i].target)})`
          : "",
    )
    .filter((x) => x !== "")
    .join(";")
}

export function parseNodeText(nodeStates: GraphElementStateType[]) {
  return nodeStates
    .map((node, i) =>
      node.group !== null
        ? `(${getNodeLabel(i)},${(node.group + 1).toString()})`
        : node.selected
          ? `${getNodeLabel(i)}`
          : "",
    )
    .filter((x) => x !== "")
    .join(";")
}

/**
 * Highlight the edges in the graph
 * In place operation
 * @param graph
 * @param edges
 * @param group
 */
export function setEdgesGroup(graph: Graph, edges: Edge[], group: number) {
  for (const edge of edges) {
    edge.group = group
    graph.setEdgeGroup(edge.source, edge.target, edge.group)
  }
}
