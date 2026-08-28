<script lang="ts">
  type GraphElementStateType = { selected: boolean; group: null | number }

  interface Props {
    u: { x: number; y: number }
    v: { x: number; y: number }
    weight?: number
    directed?: boolean
    clickable?: boolean
    state: GraphElementStateType
    onClickCallback?: () => void
  }

  const {
    u,
    v,
    weight,
    directed = false,
    clickable = false,
    state,
    onClickCallback = () => {},
  }: Props = $props()

  function getVectorLength(x: number, y: number) {
    return Math.sqrt(x * x + y * y)
  }

  function getNormalVec(u: { x: number; y: number }, v: { x: number; y: number }) {
    const orthVec = {
      x: v.y - u.y,
      y: u.x - v.x,
    }
    const len = getVectorLength(orthVec.x, orthVec.y)
    return {
      x: orthVec.x / len,
      y: orthVec.y / len,
    }
  }

  let edgeStyle = $derived(
    `stroke-${
      state.selected ? "cg-4" : state.group !== null ? `cg-${state.group}` : "primary"
    }${clickable ? " cursor-pointer" : ""}`,
  )

  let normalVec = $derived(getNormalVec(u, v))
  let center = $derived({ x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 })

  // Arrow computations
  let curveHandle = $derived(
    directed ? { x: center.x + normalVec.x * 25, y: center.y + normalVec.y * 25 } : null,
  )

  let arrowDirUnit = $derived(
    directed
      ? (() => {
          const dir = { x: v.x - curveHandle!.x, y: v.y - curveHandle!.y }
          const len = getVectorLength(dir.x, dir.y)
          return { x: dir.x / len, y: dir.y / len }
        })()
      : null,
  )

  let weightOffset = $derived(directed ? 38 : 18)
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<g>
  {#if directed}
    <!-- Curved path from u to v with offset to prevent overlap with node -->
    <path
      class={edgeStyle}
      stroke-width="6"
      fill="none"
      d={`M ${u.x} ${u.y} Q ${curveHandle!.x} ${curveHandle!.y}, ${v.x - 32 * arrowDirUnit!.x} ${v.y - 32 * arrowDirUnit!.y}`}
      onclick={onClickCallback}
    />
    <!-- Directed helper line (invisible but clickable) -->
    <path
      class={`${clickable ? "cursor-pointer" : ""}`}
      stroke="currentColor"
      stroke-width="20"
      stroke-opacity="0"
      fill="none"
      pointer-events="stroke"
      d={`M ${u.x} ${u.y} Q ${curveHandle!.x} ${curveHandle!.y}, ${v.x - 32 * arrowDirUnit!.x} ${v.y - 32 * arrowDirUnit!.y}`}
      onclick={onClickCallback}
    />

    <!-- Arrowhead at the tip -->
    <path
      d="M0,0 V4 L4,2 Z"
      class={`fill-${state.selected ? "cg-4" : state.group !== null ? `cg-${state.group}` : "primary"}`}
      transform={`translate(${v.x},${v.y}) scale(4,4) rotate(${Math.atan2(v.y - curveHandle!.y, v.x - curveHandle!.x) * (180 / Math.PI)},0,0) translate(-9.7,-1.9)`}
    />
  {:else}
    <!-- Undirected helper line (invisible but clickable) -->
    <line
      class={`${clickable ? "cursor-pointer" : ""}`}
      stroke="currentColor"
      stroke-width="20"
      stroke-opacity="0"
      fill="none"
      pointer-events="stroke"
      x1={u.x}
      y1={u.y}
      x2={v.x}
      y2={v.y}
      onclick={onClickCallback}
    />
    <!-- Undirected straight edge -->
    <line
      class={edgeStyle}
      stroke-width="6"
      x1={u.x}
      y1={u.y}
      x2={v.x}
      y2={v.y}
      onclick={onClickCallback}
    />
  {/if}

  {#if weight !== undefined}
    <!-- Edge weight label -->
    <text
      class="fill-primary select-none"
      text-anchor="middle"
      dominant-baseline="central"
      x={center.x + normalVec.x * weightOffset}
      y={center.y + normalVec.y * weightOffset}
      font-size="1.5em"
    >
      {weight}
    </text>
  {/if}
</g>
