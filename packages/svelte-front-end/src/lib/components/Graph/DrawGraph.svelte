<script lang="ts">
  import EdgeComp from "$lib/components/Graph/Edge.svelte"
  import {
    edgeInputSetText,
    nodeInputSetText,
    saveEdgeInput,
    saveNodeInput,
  } from "$lib/components/Graph/inputHelper.ts"
  import NodeComp from "$lib/components/Graph/Node.svelte"
  import { Toggle } from "$lib/components/ui/toggle"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { getContext, untrack } from "svelte"
  import { TextCursorInput } from "@lucide/svelte"
  import { edgeInputFieldID, nodeInputFieldID, type Edge, type Graph } from "@shared/utils/graph.ts"
  import { tFunction } from "@shared/utils/translations.ts"
  import Markdown from "../markdown/markdown.svelte"
  import { ADD_TEXTFIELDS_AFTERWARDS, type FormContextValue } from "../types.ts"

  type GraphElementStateType = { selected: boolean; group: null | number }

  interface Props {
    maxWidth: number
    maxHeight: number
    graph: Graph
  }
  const { maxWidth, maxHeight, graph }: Props = $props()
  const lang = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))

  let svgRef: SVGSVGElement | null = null
  const coordinateScale = 60
  const nodeScale = 20
  // limited by the number of colors we have. See tailwind --color-group-0,...,--color-group-7.
  const maxGroups = 8

  function cloneNodesForState(nodes: Graph["nodes"]): Graph["nodes"] {
    return nodes.map((node) => ({
      ...node,
      coords: { ...node.coords },
    }))
  }

  function buildEdgeListForState(graph: Graph): Edge[] {
    return graph.edges
      .flat()
      .filter(graph.directed ? () => true : (edge) => edge.source < edge.target)
      .map((edge) => ({ ...edge }))
  }

  let nodeList = $derived(cloneNodesForState(graph.nodes))
  let edgeListFlat = $derived(buildEdgeListForState(graph))
  const nodeClickType = $derived(graph.nodeClickType)
  const edgeClickType = $derived(graph.edgeClickType)

  let fieldOpen = $state(false)
  const inputFieldBase = $derived(graph.inputFieldID ?? null)
  const hasInputFieldId = $derived(inputFieldBase !== null)
  const nodeId = $derived.by(() => (inputFieldBase ? nodeInputFieldID(inputFieldBase) : null))
  const edgeId = $derived.by(() => (inputFieldBase ? edgeInputFieldID(inputFieldBase) : null))
  const nodeInputFieldMd = $derived(nodeId ? `${nodeId}#TL###` : null)
  const edgeInputFieldMd = $derived(edgeId ? `${edgeId}#TL###` : null)

  const { addTextFieldAfterwards } = getContext<FormContextValue>(ADD_TEXTFIELDS_AFTERWARDS)

  let registeredInputFieldBase: number | null = null
  $effect(() => {
    const currentInputFieldBase = inputFieldBase
    if (currentInputFieldBase === null || registeredInputFieldBase === currentInputFieldBase) return

    if (nodeClickType !== "none" && nodeInputFieldMd) {
      addTextFieldAfterwards(nodeInputFieldMd)
    }
    if (edgeClickType !== "none" && edgeInputFieldMd) {
      addTextFieldAfterwards(edgeInputFieldMd)
    }

    registeredInputFieldBase = currentInputFieldBase
  })

  // get context (the provider should keep this object reactive)
  const context = getContext<FormContextValue>(ADD_TEXTFIELDS_AFTERWARDS)

  // derive the live field objects from the context (no one-time copies)
  // this reads the context object each time it changes
  const nodeField = $derived(() => (nodeId ? context.textFieldStateValues?.[nodeId] : undefined))
  const edgeField = $derived(() => (edgeId ? context.textFieldStateValues?.[edgeId] : undefined))

  const nodeDisabled = $derived(() => nodeField()?.disabled ?? false)
  const edgeDisabled = $derived(() => edgeField()?.disabled ?? false)

  // derive the text string reactively from nodeField
  const nodeText = $derived(() => (nodeId ? (nodeField()?.text ?? "") : ""))
  const edgeText = $derived(() => (edgeId ? (edgeField()?.text ?? "") : ""))

  $effect(() => {
    if (!nodeId) return
    const text = nodeText()
    untrack(() => {
      saveNodeInput(text, nodeList, graph, lang)
    })
  })

  $effect(() => {
    if (!edgeId) return
    const text = edgeText()
    untrack(() => {
      saveEdgeInput(text, edgeListFlat, graph, lang)
    })
  })

  $effect(() => {
    const currentGraph = graph
    nodeList = cloneNodesForState(currentGraph.nodes)
    edgeListFlat = buildEdgeListForState(currentGraph)
  })

  let currentlyDragged = $state<null | number>(null)

  let nodePositions = $derived(
    nodeList.map((u) => {
      return {
        x: u.coords.x * coordinateScale,
        y: u.coords.y * coordinateScale,
      }
    }),
  )
  let nodeStates = $derived<GraphElementStateType[]>(
    nodeList.map((u) => ({
      selected: nodeClickType === "select" || nodeClickType === "selectupgrade" ? !!u.group : false,
      group: nodeClickType === "group" || nodeClickType === "groupupgrade" ? (u.group ?? null) : null,
    })),
  )

  const edgeStates = $derived<GraphElementStateType[]>(
    edgeListFlat.map((e) => ({
      selected: edgeClickType === "select" || edgeClickType === "selectupgrade" ? !!e.group : false,
      group: edgeClickType === "group" || edgeClickType === "groupupgrade" ? (e.group ?? null) : null,
    })),
  )

  function handleSetDragged(i: number) {
    if (currentlyDragged === null) {
      currentlyDragged = i
    }
  }

  function handleClickNode(i: number) {
    if (nodeClickType === "select") {
      if (nodeList[i].group) nodeList[i].group = null
      else nodeList[i].group = 1
    } else if (nodeClickType === "group") {
      const max = Math.min(graph.nodeGroupMax ?? maxGroups, maxGroups) - 1
      nodeList[i].group =
        nodeList[i].group === max ? null : nodeList[i].group === null ? 0 : nodeList[i].group! + 1
    }
    // reassign to trigger reactivity
    nodeList = [...nodeList]

    nodeInputSetText(nodeField(), nodeStates)
  }

  function handleClickEdge(i: number) {
    if (edgeClickType === "select") {
      if (edgeListFlat[i].group) edgeListFlat[i].group = null
      else edgeListFlat[i].group = 1
    } else if (edgeClickType === "group") {
      edgeListFlat[i].group =
        edgeListFlat[i].group === Math.min(graph.edgeGroupMax ?? maxGroups, maxGroups) - 1
          ? null
          : edgeListFlat[i].group === null
            ? 0
            : edgeListFlat[i].group! + 1
    }
    // reassign to trigger reactivity
    edgeListFlat = [...edgeListFlat]

    edgeInputSetText(edgeField(), edgeListFlat, graph)
  }

  const dimensions = $derived(graph.getDimensions())
  const margin = 0.7
  const minViewBox = { width: 100, height: 100 }
  const viewBox = $derived.by(() => {
    const vb = {
      x: (dimensions.minX - margin) * coordinateScale,
      y: (dimensions.minY - margin) * coordinateScale,
      width: (dimensions.width + 2 * margin) * coordinateScale,
      height: (dimensions.height + 2 * margin) * coordinateScale,
    }

    if (vb.width < minViewBox.width) {
      vb.x -= (minViewBox.width - vb.width) * 0.5
      vb.width = minViewBox.width
    }

    if (vb.height < minViewBox.height) {
      vb.y -= (minViewBox.height - vb.height) * 0.5
      vb.height = minViewBox.height
    }

    return vb
  })

  const viewBoxAspectRatio = $derived(Math.min(maxHeight / maxWidth, viewBox.height / viewBox.width))

  function updateDraggedNode(clientX: number, clientY: number) {
    if (currentlyDragged === null || !svgRef) return

    const pt = svgRef.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const svgPos = pt.matrixTransform(svgRef.getScreenCTM()?.inverse())

    const nodeRadius = nodeScale
    const minX = viewBox.x - (viewBox.width - maxWidth) / 2
    const maxX = viewBox.x + viewBox.width + (viewBox.width - maxWidth) / 2
    const minY = viewBox.y + nodeRadius
    const maxY = viewBox.y + viewBox.height - nodeRadius

    const constrainedX = Math.max(minX, Math.min(maxX, svgPos.x))
    const constrainedY = Math.max(minY, Math.min(maxY, svgPos.y))

    nodePositions[currentlyDragged].x = constrainedX
    nodePositions[currentlyDragged].y = constrainedY
    nodePositions = [...nodePositions]
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="mb-8">
  <div class="relative">
    <svg
      bind:this={svgRef}
      width={maxWidth}
      height={viewBox.height / viewBox.width > 1 && viewBox.height < maxHeight
        ? viewBox.height * 0.75
        : maxWidth * viewBoxAspectRatio}
      viewBox={`${viewBox.x} ${viewBox.y - 10} ${viewBox.width} ${viewBox.height + 20}`}
      class="bg-secondary mx-auto h-auto max-w-full touch-none overscroll-x-none rounded-2xl"
      onmousemove={(e) => updateDraggedNode(e.clientX, e.clientY)}
      onmouseup={() => {
        if (currentlyDragged !== null) {
          currentlyDragged = null
        }
      }}
      ontouchmove={(e) => {
        // Always prevent default when a node is being dragged
        if (currentlyDragged !== null) {
          e.preventDefault()
          e.stopPropagation()
          updateDraggedNode(e.touches[0].clientX, e.touches[0].clientY)
        }
      }}
      ontouchend={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (currentlyDragged !== null) {
          currentlyDragged = null
        }
      }}
      ontouchcancel={(e) => {
        e.preventDefault()
        if (currentlyDragged !== null) {
          currentlyDragged = null
        }
      }}
    >
      <g>
        {#each edgeListFlat as e, i (i)}
          <EdgeComp
            u={nodePositions[e.source]}
            v={nodePositions[e.target]}
            weight={e.value}
            directed={graph.directed}
            clickable={edgeClickType === "select" || edgeClickType === "group"}
            state={edgeStates[i]}
            onClickCallback={() => {
              if (edgeClickType === "select" || edgeClickType === "group") {
                if (!edgeDisabled()) {
                  handleClickEdge(i)
                }
              }
            }}
          />
        {/each}
      </g>
      <g>
        {#each nodeList as u, i (i)}
          <NodeComp
            pos={nodePositions[i]}
            setDragged={graph.nodeDraggable ? () => handleSetDragged(i) : undefined}
            size={nodeScale}
            label={u.label ?? ""}
            clickable={nodeClickType === "select" || nodeClickType === "group"}
            nodeState={nodeStates[i]}
            onClickCallback={() => {
              if (nodeClickType === "select" || nodeClickType === "group") {
                if (!nodeDisabled()) {
                  handleClickNode(i)
                }
              }
            }}
          />
        {/each}
      </g>
    </svg>
    <div
      class="absolute right-28 -bottom-6 flex flex-row items-center space-x-1 rounded-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {#if hasInputFieldId && (nodeClickType === "select" || nodeClickType === "group" || edgeClickType === "select" || edgeClickType === "group")}
        <Toggle
          class="hover:cursor-pointer"
          size="sm"
          variant="bg"
          disabled={nodeField()?.disabled || edgeField()?.disabled}
          onclick={() => {
            fieldOpen = !fieldOpen
          }}
        >
          <TextCursorInput />
        </Toggle>
      {/if}
    </div>
  </div>
  {#if hasInputFieldId && (nodeClickType === "select" || nodeClickType === "group") && fieldOpen}
    <div class="mt-4">
      <div class="mb-1">
        <b>{t("nodeSelection")}</b>
      </div>
      <div class="flex w-full flex-row items-center justify-center space-x-1">
        <div class="mr-0.5 flex-grow">
          <Markdown md={`{{${nodeInputFieldMd ?? ""}}}`} />
        </div>
      </div>
    </div>
  {/if}
  {#if hasInputFieldId && (edgeClickType === "select" || edgeClickType === "group") && fieldOpen}
    <div class="mt-1">
      <div class="mb-1">
        <b>{t("edgeSelection")}</b>
      </div>
      <div class="flex w-full flex-row items-center justify-center space-x-1">
        <div class="mr-0.5 flex-grow">
          <Markdown md={`{{${edgeInputFieldMd}}}`} />
        </div>
      </div>
    </div>
  {/if}
</div>
