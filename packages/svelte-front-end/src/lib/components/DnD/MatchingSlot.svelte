<script lang="ts">
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import { untrack } from "svelte"
  import { useDraggable, useDroppable } from "@dnd-kit-svelte/core"

  export interface SlotItem {
    id: string
    content: string
  }

  interface Props {
    id: string
    item: SlotItem | null
    onRemove: () => void
    disabled?: boolean
    correctness?: boolean | null
  }

  const { id, item, onRemove, disabled = false, correctness = null }: Props = $props()

  const drop = untrack(() => useDroppable({ id }))
  const drag = untrack(() => useDraggable({ id: `${id}-drag` }))

  const dragStyle = $derived(
    drag.transform.current
      ? `transform: translate(${drag.transform.current.x}px, ${drag.transform.current.y}px)`
      : "",
  )

  const dragProps = $derived(
    disabled || !item ? {} : { ...drag.attributes.current, ...drag.listeners.current },
  )
</script>

<div
  bind:this={drop.node.current}
  class={`relative flex min-h-[40px] items-center rounded-md border px-2 py-2 transition-colors
    ${
      correctness === true
        ? "border-green-500 bg-green-900/20"
        : correctness === false
          ? "border-red-500 bg-red-900/20"
          : drop.isOver.current
            ? "border-goethe bg-goethe/20"
            : "border-gray-500/60 dark:border-gray-600/60"
    }`}
>
  <div
    bind:this={drag.node.current}
    style={dragStyle}
    {...dragProps}
    class={`flex-1 text-center ${disabled ? "cursor-not-allowed" : "cursor-move"}`}
  >
    {#if item && !drag.isDragging.current}
      <Markdown md={item.content} />
    {/if}
  </div>

  {#if item && !disabled}
    <button
      type="button"
      onclick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
      class="hover:border-goethe hover:text-goethe ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center
             rounded-md border border-gray-400/40 text-gray-400"
      aria-label="Undo"
    >
      ↺
    </button>
  {/if}
</div>
