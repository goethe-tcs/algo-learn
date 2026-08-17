<script lang="ts">
  import { browser } from "$app/environment"
  import CodeComp from "$lib/components/PseudoCode/CodeComp.svelte"
  import { pseudoCodeToString } from "$lib/components/PseudoCode/renderPseudoCode.ts"
  import MyTooltip from "$lib/components/ui/MyTooltip.svelte"
  import { toggleVariants } from "$lib/components/ui/toggle"
  import { globalTranslations } from "$lib/translation.ts"
  import { cn } from "$lib/utils.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { Toggle, Tooltip } from "bits-ui"
  import Copy from "@lucide/svelte/icons/copy"
  import ListOrdered from "@lucide/svelte/icons/list-ordered"
  import PaintBucket from "@lucide/svelte/icons/paint-bucket"
  import type { PseudoCode } from "@shared/utils/pseudoCodeUtils.ts"
  import { tFunction } from "@shared/utils/translations.ts"

  interface Props {
    displayCode: string
  }
  const { displayCode }: Props = $props()

  const pseudoCodeStringParse: PseudoCode = $derived(JSON.parse(displayCode) as PseudoCode)

  const { pseudoCodeString, pseudoCodeStringColor, pseudoCodeStringLatex } = $derived(
    pseudoCodeToString(pseudoCodeStringParse),
  )

  const lang = $derived(getLanguage())
  const { t } = $derived(tFunction(globalTranslations, lang))

  const numCodeLines = $derived(pseudoCodeString.length)

  let toggleStateLines = $state(true)
  let toggleStateColor = $state(true)
  let recentlyCopied = $state(false)

  const handleClickCopyIcon: () => void = () => {
    if (!browser) return
    void navigator.clipboard
      .writeText(pseudoCodeStringLatex.filter((codeLine) => codeLine.trim() !== "").join("\n"))
      .then(() => {
        recentlyCopied = true
      })
  }
  function mouseLeave() {
    recentlyCopied = false
  }
</script>

<div class="my-5">
  <div class="relative">
    <div
      class="min-h-32 overflow-hidden rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="whitespace-nowrap">
        {#if toggleStateColor}
          <pre
            class="pt-font-mono -mt-2 -mb-4 overflow-x-auto pr-10 pl-5 leading-normal whitespace-pre text-gray-900 dark:text-gray-100">
            <CodeComp currentCode={pseudoCodeStringColor} {toggleStateLines} {numCodeLines} />
          </pre>
        {:else}
          <pre
            class="-mt-2 -mb-4 overflow-x-auto pr-10 pl-5 font-mono leading-normal whitespace-pre text-gray-900 dark:text-gray-100">
            <CodeComp currentCode={pseudoCodeString} {toggleStateLines} {numCodeLines} />
          </pre>
        {/if}
      </div>
    </div>
    <div
      class="absolute top-1 right-1 flex flex-col items-center space-y-1 rounded-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <Tooltip.Provider>
        <MyTooltip contentProps={{ side: "left", sideOffset: 5 }}>
          {#snippet trigger()}
            <Toggle.Root
              pressed={toggleStateLines}
              onPressedChange={() => {
                toggleStateLines = !toggleStateLines
              }}
              class={cn(
                toggleVariants["base"],
                toggleVariants["variants"]["variant"]["default"],
                toggleVariants["variants"]["size"]["sm"],
                "hover:cursor-pointer",
              )}
            >
              <ListOrdered size={22} strokeWidth={1.5} absoluteStrokeWidth />
            </Toggle.Root>
          {/snippet}
          {t("lineNumberTooltip")}
        </MyTooltip>
      </Tooltip.Provider>
      <Tooltip.Provider>
        <MyTooltip contentProps={{ side: "left", sideOffset: 5 }}>
          {#snippet trigger()}
            <Toggle.Root
              pressed={toggleStateColor}
              onPressedChange={() => {
                toggleStateColor = !toggleStateColor
              }}
              class={cn(
                toggleVariants["base"],
                toggleVariants["variants"]["variant"]["default"],
                toggleVariants["variants"]["size"]["sm"],
                "hover:cursor-pointer",
              )}
            >
              <PaintBucket size={22} strokeWidth={1.5} absoluteStrokeWidth />
            </Toggle.Root>
          {/snippet}
          {t("colorHighlightingTooltip")}
        </MyTooltip>
      </Tooltip.Provider>
      <Tooltip.Provider>
        <MyTooltip open={recentlyCopied} contentProps={{ side: "left", sideOffset: 5 }}>
          {#snippet trigger()}
            <div
              role="button"
              tabindex="0"
              onclick={handleClickCopyIcon}
              onmouseleave={mouseLeave}
              onkeydown={(e) => (e.key === "Enter" || e.key === " ") && handleClickCopyIcon()}
              class="ring-offset-background hover:bg-muted hover:text-muted-foreground focus-visible:ring-ring data-[state=on]:bg-accent data-[state=on]:text-accent-foreground inline-flex h-8 items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <Copy size={18} strokeWidth={1.3} absoluteStrokeWidth />
            </div>
          {/snippet}
          {recentlyCopied ? t("copyLinkCopied") : t("copyCodeLatex")}
        </MyTooltip>
      </Tooltip.Provider>
    </div>
  </div>
</div>
