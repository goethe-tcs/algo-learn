<script lang="ts">
  import { browser } from "$app/environment"
  import FilterSortHeader from "$lib/components/catalogue/FilterSortHeader.svelte"
  import Topic from "$lib/components/catalogue/Topic.svelte"
  import TvGenerators from "$lib/components/catalogue/TVGenerators.svelte"
  import TvHeader from "$lib/components/catalogue/TVHeader.svelte"
  import Footer from "$lib/components/footer.svelte"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import type { HTMLAttributes } from "svelte/elements"
  import { X } from "@lucide/svelte"
  import { collection, type QuestionTopic } from "@settings/questionsSelection"
  import type { Language } from "@shared/api/Language"
  import { _ } from "@shared/utils/generics.ts"

  const { ...rest }: HTMLAttributes<HTMLDivElement> = $props()
  const lang: Language = $derived(getLanguage())

  let selectedTopic: QuestionTopic | "all" = $state("all")
  let sortBy: "Name" | "Default" = $state("Default")
  let selectedGroup: string | null = $state(null)
  let expandedContentEl: HTMLDivElement | null = $state(null)
  // Track showAllVariants per topic (keyed by topic ID or slug)
  let showAllVariants: Record<string, boolean> = $state({})
  let columns = $state(4) // Default to max columns

  function resizeObserverAction(_node: HTMLElement) {
    void _node // to avoid unused var warning
    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1024) columns = 4
      else if (width >= 768) columns = 3
      else if (width >= 640) columns = 2
      else columns = 1
    }

    updateColumns() // initial
    window.addEventListener("resize", updateColumns)

    return {}
  }

  const filtered = $derived(
    selectedTopic === "all"
      ? collection
      : collection.filter((g) => g.topics.includes(selectedTopic as QuestionTopic)),
  )
  const sorted = $derived(
    [...filtered].sort((a, b) => {
      // typescript needs this assertion
      if (sortBy === "Default") return 0 // Keep original order
      if (sortBy === "Name") return a.name[lang]!.localeCompare(b.name[lang]!)
      // For default, we can just return 0 to keep the original (filtered) order,
      return 0
    }),
  )
  const rows = $derived(_.chunk(sorted, columns))

  const storageKey = "catalogue.selectedGroup.session"

  if (browser) {
    const stored = sessionStorage.getItem(storageKey)
    if (stored && collection.some((group) => group.slug === stored)) {
      selectedGroup = stored
    }
  }

  $effect(() => {
    if (!browser) return
    if (selectedGroup) sessionStorage.setItem(storageKey, selectedGroup)
    else sessionStorage.removeItem(storageKey)
  })

  function toggleGroup(slug: string) {
    // Toggle open/close instantly
    selectedGroup = selectedGroup === slug ? null : slug

    // Scroll new section into view (optional)
    if (selectedGroup) {
      setTimeout(() => {
        expandedContentEl?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }, 20)
    }
  }
</script>

<div class="mt-4 flex items-center justify-center px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
  <div {...rest} class="w-full py-2" use:resizeObserverAction>
    <FilterSortHeader bind:selectedTopic bind:sortBy />

    {#each rows as row (row[0]?.slug)}
      <div class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {#each row as g (g.slug)}
          <Topic {g} {selectedGroup} {toggleGroup} />
        {/each}
      </div>

      <!-- Generator Grid  -->
      {#if row.find((g) => g.slug === selectedGroup)}
        {#each row.filter((g) => g.slug === selectedGroup) as gSelected (gSelected.slug)}
          <div bind:this={expandedContentEl} class="mt-2 mb-8">
            <div
              class="relative rounded-md border border-slate-300
                     bg-gradient-to-br from-slate-100/80 to-slate-300/30
                     p-6 shadow-inner sm:p-8
                     dark:border-slate-700
                     dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-slate-600/30"
            >
              <div
                role="button"
                tabindex="0"
                onclick={() => (selectedGroup = null)}
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    selectedGroup = null
                  }
                }}
                aria-expanded={selectedGroup === null}
                class="absolute top-4 right-4 rounded-md p-1 text-gray-500 transition hover:bg-white/10 hover:text-gray-300"
                title="Close"
              >
                <X class="h-6 w-6" />
              </div>

              <div class="mx-auto max-w-7xl">
                <TvHeader {gSelected} bind:showAllVariants />
                {#if gSelected.contents?.length}
                  <TvGenerators {gSelected} {showAllVariants} />
                {:else}
                  <!-- Should not be reached, therefore no translation. -->
                  <p class="text-gray-500 dark:text-gray-400">No generators available.</p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    {/each}
  </div>
</div>

<Footer />
