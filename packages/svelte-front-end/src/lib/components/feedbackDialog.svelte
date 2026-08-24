<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js"
  import * as Card from "$lib/components/ui/card/index.js"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import Github from "@icons-pack/svelte-simple-icons/icons/SiGithub"
  import Mail from "@lucide/svelte/icons/mail"
  import MessageSquareText from "@lucide/svelte/icons/message-square-text"
  import type { Language } from "@shared/api/Language.ts"
  import { tFunction } from "@shared/utils/translations"
  import { Button } from "./ui/button"

  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction(globalTranslations, lang))
  let alertOpen = $state(false)

  const openMail = () => {
    const SEALMAIL = "seal@ae.cs.uni-frankfurt.de"
    window.location.href = `mailto:${SEALMAIL}?subject=${t("About.mail.feedback.Subject")}&body=${t("About.mail.feedback.Body")}`
    alertOpen = false
  }
  const openGithubIssue = () => {
    window.open("https://github.com/SEAL-Self-Assessment-and-Learning/algo-learn/issues")
    alertOpen = false
  }
</script>

<AlertDialog.Root bind:open={alertOpen}>
  <AlertDialog.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size="icon"
        class="focus-visible:ring-goethe-foreground/70"
        {...props}
        aria-label={t("About.giveFeedback")}
      >
        <MessageSquareText class="size-4" />
      </Button>
    {/snippet}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{t("About.valueFeedback")}</AlertDialog.Title>
      <AlertDialog.Description class="flex flex-col gap-3 text-left">
        <Card.Root class="w-full cursor-pointer gap-2 py-4" onclick={openMail}>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-base">
              <Mail class="size-5 shrink-0" />
              {t("About.suggestImprovement")}
            </Card.Title>
          </Card.Header>
          <Card.Content class="text-muted-foreground">
            {t("About.suggestImprovement.text")}
          </Card.Content>
        </Card.Root>
        <Card.Root class="w-full cursor-pointer gap-2 py-4" onclick={openGithubIssue}>
          <Card.Header>
            <Card.Title class="flex items-center gap-2 text-base">
              <span class="flex shrink-0"><Github size={20} /></span>
              {t("About.reportBug")}
            </Card.Title>
          </Card.Header>
          <Card.Content class="text-muted-foreground">{t("About.reportBug.text")}</Card.Content>
          <Card.Footer class="text-muted-foreground text-xs">{t("About.reportBug.unsure")}</Card.Footer>
        </Card.Root>
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="sm:flex-wrap">
      <AlertDialog.Cancel onclick={() => (alertOpen = false)}>
        {t("About.cancel")}
      </AlertDialog.Cancel>
      <AlertDialog.Action onclick={openMail}>
        <Mail />
        {t("About.contactMail")}
      </AlertDialog.Action>
      <AlertDialog.Action onclick={openGithubIssue}>
        <Github size={16} />
        {t("About.openIssue")}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
