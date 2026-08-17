<script lang="ts">
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import { untrack } from "svelte"
  import type { UniqueIdentifier } from "@dnd-kit-svelte/core"
  import { useSortable } from "@dnd-kit-svelte/sortable"
  import { CSS, styleObjectToString } from "@dnd-kit-svelte/utilities"
  import GripHorizontal from "@lucide/svelte/icons/grip-horizontal"

  interface Item {
    id: UniqueIdentifier
    content: string
  }

  let { task, disabled }: { task: Item; disabled?: boolean } = $props()

  const { attributes, listeners, node, transform, transition, isDragging, isSorting } = untrack(() =>
    useSortable({
      id: task.id,
    }),
  )

  const style = $derived(
    styleObjectToString({
      transform: CSS.Transform.toString(transform.current),
      transition: isSorting.current ? transition.current : undefined,
      zIndex: isDragging.current ? 1 : undefined,
    }),
  )
</script>

<div
  class="relative select-none"
  bind:this={node.current}
  {style}
  {...!disabled ? listeners.current : {}}
  {...attributes.current}
>
  <!-- Original element - becomes invisible during drag but maintains dimensions -->
  <div class={[`flex w-auto items-center`, { invisible: isDragging.current }]}>
    <GripHorizontal class={`mr-4 ${disabled ? "" : "hover:cursor-pointer"}`} />
    <div class="hover:bg-goethe rounded-md border-1 border-gray-200 px-4 py-2 dark:border-gray-800">
      <Markdown md={task.content} />
    </div>
  </div>
</div>
