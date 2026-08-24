<script lang="ts">
  import { topicColorBorder, topicColorsBG } from "$lib/components/catalogue/utils.ts"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js"
  import { getLanguage } from "$lib/utils/langState.svelte.js"
  import { CheckCheck, ListFilterPlus } from "@lucide/svelte"
  import { allQuestionTopics, topicNames, type QuestionTopic } from "@settings/questionsSelection.js"
  import type { Language } from "@shared/api/Language.ts"
  import type { SingleTranslation } from "@shared/utils/translations.ts"

  interface Props {
    selectedTopic?: QuestionTopic | "all"
    sortBy?: "Name" | "Default"
  }
  // Mark props as bindable and provide defaults
  let {
    selectedTopic = $bindable<QuestionTopic | "all">("all"),
    sortBy = $bindable<"Name" | "Default">("Default"),
  }: Props = $props()

  const lang: Language = $derived(getLanguage())

  const allLang: SingleTranslation = { en: "All", de: "Alle" }
  const sortByLang: SingleTranslation = { en: "Sort by:", de: "Sortieren nach:" }
  const sortOptionLang: Record<"Name" | "Default", SingleTranslation> = {
    Name: { en: "Name", de: "Name" },
    Default: { en: "Default", de: "Standard" },
  }
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
  <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
    <button
      onclick={() => (selectedTopic = "all")}
      class="flex h-8 items-center justify-center rounded-md border-2 px-3 text-xs font-medium transition-all
      {selectedTopic === 'all'
        ? 'border-slate-800 bg-slate-800 text-white dark:border-slate-300 dark:bg-slate-300 dark:text-gray-900'
        : 'border-gray-300 text-gray-500 hover:border-black hover:text-black dark:border-gray-700 dark:text-gray-400 dark:hover:border-white dark:hover:text-white'}"
    >
      {allLang[lang]}
    </button>

    {#each allQuestionTopics as topic (topic)}
      <button
        onclick={() => {
          if (selectedTopic === topic) {
            selectedTopic = "all"
          } else {
            selectedTopic = topic
          }
        }}
        title={topic}
        class={`flex h-7 transform-gpu items-center justify-center rounded-md border px-3 text-xs font-medium transition-all duration-200 hover:scale-[1.02]
                  hover:brightness-95 dark:hover:brightness-110
          ${
            selectedTopic === topic
              ? `${topicColorsBG[topic]} border-transparent text-white`
              : `text-gray-700 dark:text-gray-300 ${topicColorBorder[topic]}`
          }`}
      >
        {topicNames[topic][lang]}
      </button>
    {/each}
  </div>

  <div class="mt-2 flex w-full sm:mt-0 sm:w-auto">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50 sm:w-auto sm:justify-start
           dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <ListFilterPlus class="h-4 w-4" />
        {sortByLang[lang]}
        <span class="font-medium">{sortOptionLang[sortBy][lang]}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content class="rounded-md bg-white p-1 shadow-md dark:bg-gray-800">
        <DropdownMenu.Item
          class="flex items-center justify-between rounded-md px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          onclick={() => (sortBy = "Name")}
        >
          {sortOptionLang.Name[lang]}
          {#if sortBy === "Name"}
            <CheckCheck />
          {/if}
        </DropdownMenu.Item>

        <DropdownMenu.Item
          class="flex items-center justify-between rounded-md px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          onclick={() => (sortBy = "Default")}
        >
          {sortOptionLang.Default[lang]}
          {#if sortBy === "Default"}
            <CheckCheck />
          {/if}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</div>
