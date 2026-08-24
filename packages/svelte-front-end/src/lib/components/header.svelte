<script lang="ts">
  import { goto } from "$app/navigation"
  import { base, resolve } from "$app/paths"
  import { page } from "$app/state"
  import type { Pathname } from "$app/types"
  import { nextLang, pathnameInLanguage } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import type { Snippet } from "svelte"
  import { Moon, Sun } from "@lucide/svelte"
  import type { Language } from "@shared/api/Language"
  import { derivedTheme, toggleTheme } from "../theme.svelte.js"
  import FeedbackDialog from "./feedbackDialog.svelte"
  import SealLogo from "./logo/seal-logo-text-horizontal-white.svg"
  import Button from "./ui/button/button.svelte"

  const lang: Language = $derived(getLanguage())

  /** Navigate to the current page in the next language, so the URL reflects the choice. */
  function toggleLanguage() {
    // `page.url.pathname` includes the base path, which `resolve` adds back.
    const pathname = pathnameInLanguage(nextLang(lang), page.url.pathname.slice(base.length))
    void goto(resolve(pathname as Pathname))
  }
</script>

<header
  class="dark bg-goethe text-goethe-foreground flex flex-none flex-wrap items-center justify-between gap-1 p-2"
>
  {@render logo()}
  <div class="flex items-center gap-1">
    {@render crossfadeButton({
      onclick: toggleTheme,
      label: derivedTheme() === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      showFirst: derivedTheme() === "light",
      first: sunIcon,
      second: moonIcon,
    })}
    {@render crossfadeButton({
      onclick: toggleLanguage,
      label: lang === "en" ? "Switch to German" : "Switch to English",
      showFirst: lang === "en",
      first: enLabel,
      second: deLabel,
    })}
    <FeedbackDialog />
  </div>
</header>

{#snippet logo()}
  <Button
    variant="ghost"
    href={resolve("/")}
    class="focus-visible:ring-goethe-foreground/70 flex h-auto items-center gap-2 p-1"
  >
    <img src={SealLogo} alt="Logo" class="h-10" />
  </Button>
{/snippet}

{#snippet sunIcon()}<Sun class="size-4" />{/snippet}
{#snippet moonIcon()}<Moon class="size-4" />{/snippet}
{#snippet enLabel()}En{/snippet}
{#snippet deLabel()}De{/snippet}

<!-- An icon button whose two states crossfade into each other. -->
{#snippet crossfadeButton(o: {
  onclick: () => void
  label: string
  showFirst: boolean
  first: Snippet
  second: Snippet
})}
  <Button
    variant="ghost"
    size="icon"
    onclick={o.onclick}
    aria-label={o.label}
    class="focus-visible:ring-goethe-foreground/70 relative overflow-hidden"
  >
    {@render layer(o.showFirst, o.first)}
    {@render layer(!o.showFirst, o.second)}
  </Button>
{/snippet}

{#snippet layer(visible: boolean, content: Snippet)}
  <span
    class="absolute inset-0 flex items-center justify-center transition-all duration-200 {visible
      ? 'scale-100 opacity-100'
      : 'scale-75 opacity-0'}"
  >
    {@render content()}
  </span>
{/snippet}
