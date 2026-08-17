<script lang="ts">
  import MatchingPoolItem from "$lib/components/DnD/MatchingPoolItem.svelte"
  import MatchingSlot, { type SlotItem } from "$lib/components/DnD/MatchingSlot.svelte"
  import { sensors } from "$lib/components/DnD/utils.ts"
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import { onMount } from "svelte"
  import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit-svelte/core"
  import { SortableContext } from "@dnd-kit-svelte/sortable"

  export interface Pair {
    id: string
    fixed: string
    answerId: string | null
    correctness?: boolean | null
  }

  interface Props {
    pairs: Pair[]
    answers: SlotItem[]
    disabled?: boolean
    onChange: (slots: (SlotItem | null)[]) => void
    onModeChange?: (mode: "draft" | "invalid") => void
    columns?: number
  }

  const { pairs, answers, disabled = false, onChange, onModeChange, columns = 2 }: Props = $props()

  // pool uses the supplied items (cloned so we don't mutate caller's array)
  let pool = $state<SlotItem[]>([])
  let slots = $state<(SlotItem | null)[]>([])
  $effect(() => {
    // tracking answers as dependency
    const newAnswers = structuredClone(answers)

    // rebuild slots array based on pairs and answers
    const usedIds = new Set(slots.filter(Boolean).map((s) => s!.id))
    pool = newAnswers.filter((a) => !usedIds.has(a.id))
  })
  let activeItem = $state<SlotItem | null>(null)

  let isDraggingFromSlot = $state(false)

  // responsive mode flag
  let isMobile = $state(false)
  let openIndex = $state(-1)

  onMount(() => {
    const check = () => (isMobile = window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  })

  function notifyMode(slotsArr: (SlotItem | null)[]) {
    if (!onModeChange) return
    const allFilled = slotsArr.every((s) => s !== null)
    onModeChange(allFilled ? "draft" : "invalid")
  }
  // helper: find by stable id
  function findPoolIndexById(id: string) {
    return pool.findIndex((it) => it.id === id)
  }

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id)

    // slot ids are "slot-<idx>", pool items are their own stable ids
    if (id.startsWith("slot-")) {
      const slotIdx = parseInt(id.replace("slot-", ""))
      activeItem = slots[slotIdx] ?? null
      isDraggingFromSlot = true
    } else {
      const poolIdx = findPoolIndexById(id)
      activeItem = poolIdx >= 0 ? pool[poolIdx] : null
      isDraggingFromSlot = false
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e

    // clear the overlay immediately (prevent stale overlay)
    const prevActive = activeItem

    activeItem = null

    if (!over) {
      isDraggingFromSlot = false
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    // slot to return slot
    if (activeId.startsWith("slot-") && overId === "slot-return") {
      const slotIdx = parseInt(activeId.replace("slot-", ""))
      returnToPool(slotIdx)
      isDraggingFromSlot = false
      return
    }

    // pool to slot
    if (!activeId.startsWith("slot-") && overId.startsWith("slot-")) {
      const slotIdx = parseInt(overId.replace("slot-", ""))
      const poolIdx = findPoolIndexById(activeId)
      if (poolIdx < 0) {
        isDraggingFromSlot = false
        return
      }

      const item = prevActive ?? pool[poolIdx]
      const newSlots = [...slots]
      const newPool = [...pool]

      // remove the dragged item from pool
      newPool.splice(poolIdx, 1)

      // if target slot had an item, return it to the pool
      if (newSlots[slotIdx]) {
        newPool.push(newSlots[slotIdx]!)
      }

      newSlots[slotIdx] = item
      slots = newSlots
      pool = newPool
      onChange(newSlots)
      notifyMode(newSlots)

      isDraggingFromSlot = false
      return
    }

    // slot to slot swap
    if (activeId.startsWith("slot-") && overId.startsWith("slot-")) {
      const fromIdx = parseInt(activeId.replace("slot-", ""))
      const toIdx = parseInt(overId.replace("slot-", ""))

      const newSlots = [...slots]
      ;[newSlots[fromIdx], newSlots[toIdx]] = [newSlots[toIdx], newSlots[fromIdx]]

      slots = newSlots
      onChange(newSlots)
      notifyMode(newSlots)

      isDraggingFromSlot = false
      return
    }

    // fallback
    isDraggingFromSlot = false
  }

  // called by MatchingSlot remove button
  function returnToPool(slotIndex: number) {
    const item = slots[slotIndex]
    if (!item) return

    const newSlots = [...slots]
    newSlots[slotIndex] = null
    slots = newSlots

    // Only add if it's not already in the pool
    if (!pool.some((p) => p.id === item.id)) {
      pool = [...pool, item]
    }

    onChange(newSlots)
    notifyMode(newSlots)
  }

  // mobile dropdown handler
  function handleSelectChange(slotIdx: number, value: string) {
    if (disabled) return

    const newSlots = [...slots]
    const selected = answers.find((a) => a.id === value) ?? null

    // if selected item is already assigned elsewhere, unassign it first
    if (selected) {
      const prevIdx = newSlots.findIndex((s, i) => s?.id === value && i !== slotIdx)
      if (prevIdx >= 0) newSlots[prevIdx] = null
    }

    newSlots[slotIdx] = selected
    slots = newSlots
    onChange(newSlots)
    notifyMode(newSlots)
  }

  function isAlreadyUsed(id: string, currentIdx: number) {
    return slots.some((s, idx) => s?.id === id && idx !== currentIdx)
  }
</script>

{#if !isMobile}
  <!-- Desktop DnD -->
  <DndContext
    {sensors}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    onDragCancel={() => {
      activeItem = null
      isDraggingFromSlot = false
    }}
  >
    <div
      class="grid gap-4"
      style={`grid-template-columns: repeat(${columns}, minmax(0, 1fr)); align-items: stretch;`}
    >
      {#each pairs as pair, i (pair.id)}
        <div class="flex h-full flex-col rounded-lg border p-3 dark:border-gray-600 dark:bg-gray-800">
          <div class="mb-auto">
            <Markdown md={pair.fixed} />
          </div>
          <div class="mt-3">
            <MatchingSlot
              id={`slot-${i}`}
              item={slots[i]}
              onRemove={() => returnToPool(i)}
              {disabled}
              correctness={pair.correctness}
            />
          </div>
        </div>
      {/each}
    </div>

    <!-- return slot -->
    {#if isDraggingFromSlot}
      <div class="my-4 flex w-full justify-center">
        <div class="relative w-full max-w-4xl">
          <!-- RETURN SLOT -->
          <MatchingSlot
            id="slot-return"
            item={null}
            onRemove={() => {}}
            disabled={false}
            correctness={null}
          />

          <!-- return symbol overlay -->
          <div
            class="pointer-events-none absolute inset-0 flex items-center justify-center
               text-xl opacity-50 select-none"
          >
            ↺
          </div>
        </div>
      </div>
    {/if}

    <!-- POOL -->
    <div
      id="pool-area"
      class="mt-6 flex list-none flex-wrap justify-center gap-2 rounded-lg border border-dashed p-3 dark:border-gray-600"
    >
      <SortableContext items={pool.map((it) => it.id)}>
        <div class="flex list-none flex-wrap gap-2">
          {#each pool as item (item.id)}
            <MatchingPoolItem id={item.id} {item} {disabled} />
          {/each}
        </div>
      </SortableContext>
    </div>

    <DragOverlay dropAnimation={null}>
      {#if activeItem}
        <div class="rounded-md border bg-gray-100 p-2 text-center dark:bg-gray-800">
          <Markdown md={activeItem.content ?? ""} />
        </div>
      {/if}
    </DragOverlay>
  </DndContext>
{:else}
  <!-- Mobile: dropdown -->
  <div class="grid gap-3 p-2">
    {#each pairs as pair, i (pair.id)}
      {@const correctness = pair.correctness}

      <div
        class={`flex flex-col gap-1 rounded-md border p-2 transition-colors
          ${
            correctness === true
              ? "border-green-600 bg-green-900/10"
              : correctness === false
                ? "border-red-600 bg-red-900/10"
                : "border-gray-700 dark:bg-gray-900"
          }
        `}
      >
        <button
          type="button"
          class={`flex w-full items-center justify-between text-left select-none ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
          onclick={() => {
            if (!disabled) openIndex = openIndex === i ? -1 : i
          }}
        >
          <Markdown md={pair.fixed} />
          <span class="text-lg text-gray-400">{openIndex === i ? "▴" : "▾"}</span>
        </button>

        {#if slots[i] && openIndex !== i}
          <div
            class="mt-1 rounded-md border border-gray-500/30 bg-gray-100/20 p-2 dark:border-gray-600 dark:bg-gray-800/40"
          >
            <Markdown md={slots[i]?.content ?? ""} />
          </div>
        {/if}

        {#if openIndex === i}
          <div class="mt-2 grid gap-1">
            {#each answers as ans (ans.id)}
              {@const alreadyUsed = isAlreadyUsed(ans.id, i)}
              {@const isSelected = slots[i]?.id === ans.id}

              {@const btnColor = isSelected
                ? correctness === true
                  ? "bg-green-500/20 text-green-700 border-green-500"
                  : correctness === false
                    ? "bg-red-500/20 text-red-700 border-red-500"
                    : "bg-goethe text-white"
                : alreadyUsed
                  ? "text-gray-500 opacity-70"
                  : "hover:bg-goethe/10 dark:hover:bg-goethe/20"}

              <button
                type="button"
                class={`w-full rounded-md border p-2 text-left text-sm transition-colors ${btnColor} ${
                  disabled ? "cursor-not-allowed opacity-60" : ""
                }`}
                onclick={() => {
                  if (!disabled) {
                    handleSelectChange(i, ans.id)
                    openIndex = -1
                  }
                }}
              >
                <Markdown md={ans.content} />
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}
