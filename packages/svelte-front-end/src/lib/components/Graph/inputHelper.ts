import type { TextFieldState } from "$lib/components/types.ts"
import type { Language } from "@shared/api/Language.ts"
import type { Edge, Graph, NodeList } from "@shared/utils/graph.ts"
import {
  checkEdgeInput,
  checkNodeInput,
  parseEdgeText,
  parseNodeText,
  updateGraphEdgeGroup,
  updateGraphEdgeSelected,
  updateGraphNodeGroup,
  updateGraphNodeSelected,
} from "@shared/utils/graphInput.ts"

type GraphElementStateType = { selected: boolean; group: null | number }

export function edgeInputSetText(
  edgeField: TextFieldState | undefined,
  edgeListFlat: Edge[],
  graph: Graph,
) {
  if (edgeField !== undefined && edgeField.setText) {
    edgeField.setText(parseEdgeText(edgeListFlat, graph))
  }
}

export function nodeInputSetText(
  nodeField: TextFieldState | undefined,
  nodeStates: GraphElementStateType[],
) {
  if (nodeField !== undefined && nodeField.setText) {
    nodeField.setText(parseNodeText(nodeStates))
  }
}

export function saveNodeInput(nodeText: string, nodeList: NodeList, graph: Graph, lang: Language) {
  const nodeCheck = checkNodeInput(nodeText, graph, lang)
  if (nodeCheck.parsed) {
    if ("selected" in nodeCheck) {
      updateGraphNodeSelected(graph, nodeList, nodeCheck.selected)
    } else if ("group" in nodeCheck) {
      updateGraphNodeGroup(graph, nodeList, nodeCheck.groups)
    }
  }
}

export function saveEdgeInput(edgeString: string, edgeListFlat: Edge[], graph: Graph, lang: Language) {
  const edgeCheck = checkEdgeInput(edgeString, graph, lang)
  if (edgeCheck.parsed) {
    if ("selected" in edgeCheck) {
      updateGraphEdgeSelected(graph.directed, edgeListFlat, edgeCheck.selected)
    } else if ("group" in edgeCheck) {
      updateGraphEdgeGroup(graph.directed, edgeListFlat, edgeCheck.groups)
    }
  }
}
