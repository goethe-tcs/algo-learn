<script lang="ts">
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import { untrack } from "svelte"
  import { useDraggable } from "@dnd-kit-svelte/core"

  export interface SlotItem {
    id: string
    content: string
  }

  interface Props {
    id: string
    item: SlotItem
    disabled?: boolean
  }

  const { id, item, disabled = false }: Props = $props()
  const drag = untrack(() => useDraggable({ id }))

  const dragStyle = $derived(
    drag.transform.current
      ? `transform: translate(${drag.transform.current.x}px, ${drag.transform.current.y}px)`
      : "",
  )
</script>

<div
  bind:this={drag.node.current}
  style={dragStyle}
  {...!disabled ? { ...drag.attributes.current, ...drag.listeners.current } : {}}
  data-no-dnd-kit-drag-preview
  class={`rounded-md border p-2 text-center transition-all select-none
          ${disabled ? "cursor-not-allowed opacity-60" : "hover:bg-goethe cursor-move"}
          ${drag.isDragging.current ? "opacity-0" : ""} dark:border-gray-700`}
>
  <Markdown md={item.content ?? ""} />
</div>
