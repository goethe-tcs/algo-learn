<script lang="ts">
  import { resolve } from "$app/paths"
  import { getLanguage, toggleLanguage } from "$lib/utils/langState.svelte.ts"
  import { Moon, Sun } from "@lucide/svelte"
  import type { Language } from "@shared/api/Language"
  import { derivedTheme, toggleTheme } from "../theme.svelte.js"
  import FeedbackDialog from "./feedbackDialog.svelte"
  import SealLogo from "./logo/seal-logo-text-horizontal-white.svg"
  import Button from "./ui/button/button.svelte"

  const lang: Language = $derived(getLanguage())
</script>

<header
  class="dark bg-goethe text-goethe-foreground flex flex-none flex-wrap place-items-center justify-between gap-1 p-2"
>
  {@render logo()}
  <div class="grow"></div>
  {@render switchTheme()}
  {@render switchLang()}
  <FeedbackDialog />
</header>

{#snippet logo()}
  <Button variant="ghost" href={resolve("/")} class="flex items-center gap-2 px-2 text-3xl font-thin">
    <img src={SealLogo} alt="Logo" class="h-10" />
  </Button>
{/snippet}

{#snippet switchLang()}
  <Button
    variant="ghost"
    size="icon"
    onclick={toggleLanguage}
    aria-label={lang === "en" ? "Switch to German" : "Switch to English"}
    class="relative overflow-hidden"
  >
    <!-- English Flag -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-all duration-200"
      class:opacity-0={lang === "de"}
      class:scale-75={lang === "de"}
      class:opacity-100={lang === "en"}
      class:scale-100={lang === "en"}
    >
      En
    </div>

    <!-- German Flag -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-all duration-200"
      class:opacity-100={lang === "de"}
      class:scale-100={lang === "de"}
      class:opacity-0={lang === "en"}
      class:scale-75={lang === "en"}
    >
      De
    </div>
  </Button>
{/snippet}

{#snippet switchTheme()}
  <Button
    variant="ghost"
    size="icon"
    onclick={toggleTheme}
    aria-label={derivedTheme() === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    class="relative overflow-hidden"
  >
    <!-- Light Mode -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-all duration-200"
      class:opacity-0={derivedTheme() === "dark"}
      class:scale-75={derivedTheme() === "dark"}
      class:opacity-100={derivedTheme() === "light"}
      class:scale-100={derivedTheme() === "light"}
    >
      <Sun class="h-5 w-5 transition-transform duration-200" />
    </div>

    <!-- Dark Mode -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-all duration-200"
      class:opacity-100={derivedTheme() === "dark"}
      class:scale-100={derivedTheme() === "dark"}
      class:opacity-0={derivedTheme() === "light"}
      class:scale-75={derivedTheme() === "light"}
    >
      <Moon class="h-5 w-5 transition-transform duration-200" />
    </div>
  </Button>
{/snippet}
