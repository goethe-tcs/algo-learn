<script lang="ts">
  import { resolve } from "$app/paths"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import type { Language } from "@shared/api/Language"
  import { tFunction } from "@shared/utils/translations.ts"
  import { globalTranslations } from "../translation"

  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))
</script>

<footer class="bg-goethe text-goethe-foreground mt-auto">
  <div class="mx-auto w-full max-w-screen-2xl px-4 py-4">
    <div
      class="flex flex-col flex-wrap items-center justify-between gap-y-3 sm:flex-row sm:items-center sm:gap-y-0"
    >
      <!-- Logo + Name -->
      <div
        class="flex flex-wrap items-center justify-center space-x-3 sm:justify-start rtl:space-x-reverse"
      >
        <!-- <img src={SealLogo} class="h-8 brightness-0 invert filter" alt="SEAL Logo" /> -->
        <span
          class="self-center font-[Meridien_Roman] text-2xl whitespace-nowrap text-white dark:text-white"
        >
          Self Assessment and Learning
        </span>
      </div>

      <!-- Navigation Links -->
      <ul
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium sm:justify-end"
      >
        <li>
          <a href={resolve(`/${lang}/about`)} class="hover:underline">{t("About.label")}</a>
        </li>
        <li>
          <a href={resolve(`/${lang}/legal`)} class="hover:underline">{t("Legal.label")}</a>
        </li>
        <li>
          <a
            href="https://github.com/SEAL-Self-Assessment-and-Learning/algo-learn"
            class="hover:underline">GitHub</a
          >
        </li>
      </ul>
    </div>
  </div>
</footer>
