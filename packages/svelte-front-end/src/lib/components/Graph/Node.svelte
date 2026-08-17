<script lang="ts">
  type GraphElementStateType = { selected: boolean; group: null | number }

  interface Props {
    pos: { x: number; y: number }
    setDragged?: () => void
    size: number
    label?: string
    clickable?: boolean
    nodeState: GraphElementStateType
    onClickCallback: () => void
  }

  const { pos, setDragged, size, label, clickable = false, nodeState, onClickCallback }: Props = $props()

  let baseFillClass = $derived(
    nodeState.selected
      ? "fill-cg-4"
      : nodeState.group !== null
        ? `fill-cg-${nodeState.group}`
        : "fill-primary",
  )
  let hoverFillClass = $derived(clickable ? "" : "group-hover:fill-goethe")

  const dragAreaSize = $derived(size * 2)

  let startX = 0
  let startY = 0
  let dragging = false

  function handlePointerDown(e: PointerEvent) {
    startX = e.clientX
    startY = e.clientY
    dragging = false

    // Capture moves globally so we detect drags outside the circle
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  function handlePointerMove(e: PointerEvent) {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (!dragging && Math.sqrt(dx * dx + dy * dy) > 5) {
      dragging = true
      if (setDragged) setDragged()
    }
  }

  function handlePointerUp() {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)

    if (!dragging) {
      // It was a tap/click
      onClickCallback()
    }
  }
</script>

<g
  class="group outline-none"
  transform={`translate(${pos.x},${pos.y})`}
  role="button"
  tabindex="0"
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
>
  <!-- Invisible larger circle for easier dragging -->
  <circle r={dragAreaSize} fill="transparent" stroke="none" class={clickable ? "cursor-pointer" : ""} />

  <!-- Visible node circle -->
  <circle class={`${baseFillClass} ${hoverFillClass} stroke-secondary`} r={size} stroke-width="6" />

  {#if label !== undefined && label !== ""}
    <text
      text-anchor="middle"
      dominant-baseline="central"
      class={`pointer-events-none select-none ${!nodeState.selected && nodeState.group === null ? "fill-primary-foreground" : ""}`}
      font-size="1.5em"
    >
      {label}
    </text>
  {/if}
</g>
