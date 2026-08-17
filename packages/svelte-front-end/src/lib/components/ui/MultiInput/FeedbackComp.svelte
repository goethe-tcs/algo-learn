<script lang="ts">
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import type { FeedbackVariation } from "$lib/components/types"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import type { Language } from "@shared/api/Language.ts"
  import { tFunction } from "@shared/utils/translations.ts"

  interface Props {
    formatFeedback: string
    invalid: boolean
    type: FeedbackVariation // overlay means: feedback shown below the input field over other components
  }
  const { formatFeedback, invalid, type }: Props = $props()

  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction(globalTranslations, lang))

  const className = $derived(() => {
    if (type === "below") {
      const feedbackBackgroundColor = formatFeedback
        ? !invalid
          ? "border-l-4 border-green-400"
          : "border-l-4 border-red-400"
        : "border-l-4 border-blue-400"
      return `mt-2 p-2 ${feedbackBackgroundColor}`
    } else {
      const feedbackBackgroundColor = formatFeedback ? (!invalid ? "bg-green-400" : "bg-red-400") : ""
      return `absolute left-0 top-full z-10 ${feedbackBackgroundColor} border border-gray-300 dark:border-gray-700 shadow-md p-2 mt-2 rounded-md`
    }
  })
</script>

{#if type === "below"}
  <div class={`${className()} text-left`}>
    <span>
      <Markdown md={formatFeedback ? formatFeedback : t("provideFeedbackCheckFormat")} />
    </span>
  </div>
{:else}
  <div class={`${className()} text-left`}>
    {#if formatFeedback}
      <span>
        <Markdown md={formatFeedback ?? ""} />
      </span>
    {/if}
  </div>
{/if}
