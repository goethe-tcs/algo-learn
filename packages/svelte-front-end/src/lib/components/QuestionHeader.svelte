<script lang="ts">
  import { browser } from "$app/environment"
  import MyTooltip from "$lib/components/ui/MyTooltip.svelte"
  import { BASENAME } from "$lib/config.js"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { Tooltip } from "bits-ui"
  import Link from "@lucide/svelte/icons/link"
  import RefreshCw from "@lucide/svelte/icons/refresh-cw"
  import type { Language } from "@shared/api/Language.ts"
  import { tFunction } from "@shared/utils/translations.ts"

  interface Props {
    title?: string
    regenerate?: () => void
    permalink?: string
    disabled: boolean
  }

  const { title, regenerate, permalink, disabled = false }: Props = $props()
  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))
  let recentlyCopied: boolean = $state(false)

  function handleClick() {
    if (!browser) return
    void navigator.clipboard.writeText(window.location.host + BASENAME + "/" + permalink).then(() => {
      recentlyCopied = true
    })
  }

  function mouseLeave() {
    recentlyCopied = false
  }
</script>

<h1 class="text-2xl font-semibold">
  {title !== undefined && title + " "}
  {#if permalink}
    <Tooltip.Provider>
      <MyTooltip
        open={recentlyCopied}
        contentProps={{ sideOffset: 5 }}
        triggerProps={{ onclick: handleClick, onmouseleave: mouseLeave }}
      >
        {#snippet trigger()}
          <Link class="-mb-0.5 pl-1" size={22} strokeWidth={1.5} absoluteStrokeWidth />
        {/snippet}
        {(recentlyCopied ? t("copyLinkCopied") : t("copyLinkTooltip")) || ""}
      </MyTooltip>
    </Tooltip.Provider>
  {/if}
  {#if regenerate}
    <Tooltip.Provider>
      <MyTooltip
        contentProps={{ sideOffset: 5 }}
        triggerProps={{
          onclick: disabled ? undefined : regenerate,
          "aria-disabled": disabled,
          class: disabled ? "cursor-not-allowed opacity-50" : "",
        }}
      >
        {#snippet trigger()}
          <RefreshCw
            class={`-mb-0.5 pl-1 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            size={22}
            strokeWidth={1.5}
            absoluteStrokeWidth
          />
        {/snippet}
        {disabled ? t("regeneration-disabled") : t("generate-new-exercise-of-same-type")}
      </MyTooltip>
    </Tooltip.Provider>
  {/if}
</h1>
