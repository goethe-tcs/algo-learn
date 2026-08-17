<script lang="ts">
  import { browser } from "$app/environment"
  import InteractWithQuestion from "$lib/components/InteractWithQuestion.svelte"
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import type { MODE, Result } from "$lib/components/types.ts"
  import { Button } from "$lib/components/ui/button"
  import { inputClass } from "$lib/components/ui/MultiInput/cnInput.ts"
  import { globalTranslations } from "$lib/translation.ts"
  import { isMobileOrTablet } from "$lib/utils/deviceInformation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { onMount } from "svelte"
  import type { Language } from "@shared/api/Language.ts"
  import type { FreeTextFeedback, FreeTextQuestion } from "@shared/api/QuestionGenerator.ts"
  import { tFunction } from "@shared/utils/translations.ts"

  interface Props {
    question: FreeTextQuestion
    permalink?: string
    onResult?: (result: Result, finished: boolean) => void
    regenerate?: () => void
  }
  const { question, permalink, onResult, regenerate }: Props = $props()
  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))

  let questionState: {
    mode: MODE
    text: string
    feedbackObject?: FreeTextFeedback
    formatFeedback?: string
  } = $state({
    mode: "invalid",
    text: "",
  })

  let userInputRef: HTMLInputElement | null = $state(null)
  if (browser) {
    onMount(() => {
      if (!isMobileOrTablet) {
        userInputRef!.focus({ preventScroll: true })
      }
    })
  }

  function handleChange(event: Event) {
    setText((event.target as HTMLInputElement).value)
  }

  function setText(text: string) {
    questionState = {
      ...questionState,
      text,
    }
    if (question.checkFormat) {
      void Promise.resolve(question.checkFormat({ text })).then(({ valid, message }) => {
        questionState = {
          ...questionState,
          mode: valid ? "draft" : "invalid",
          formatFeedback: message,
        }
      })
    } else {
      questionState = {
        ...questionState,
        mode: text.trim().length > 0 ? "draft" : "invalid",
      }
    }
  }

  function insertText(text: string): void {
    if (userInputRef === null) {
      setText(text)
      return
    }

    setText(
      userInputRef.value.slice(0, userInputRef.selectionStart ?? 0) +
        text +
        userInputRef.value.slice(userInputRef.selectionEnd ?? 0),
    )

    userInputRef.focus()
  }

  function handleClick(finished: boolean) {
    if (questionState.mode === "draft") {
      if (question.feedback !== undefined) {
        questionState.mode = "submitted"
        void Promise.resolve(question.feedback({ text: questionState.text })).then((feedbackObject) => {
          let mode: MODE = "draft"
          if (feedbackObject.correct === true) {
            mode = "correct"
          } else if (feedbackObject.correct === false) {
            mode = "incorrect"
          }
          questionState.mode = mode
          questionState.feedbackObject = feedbackObject
        })
      }
    } else if (questionState.mode === "correct" || questionState.mode === "incorrect") {
      if (onResult) onResult(questionState.mode, finished)
    }
  }

  function onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent)) {
      return
    }
    const key = e.key
    if (key === "Enter") {
      e.preventDefault()
      handleClick(false)
    }
  }

  const msgColor = $derived(
    questionState.mode === "draft"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400",
  )

  $effect(() => {
    void lang
    if (question.feedback === undefined) return
    if (questionState.mode !== "correct" && questionState.mode !== "incorrect") return
    const textSnapshot = questionState.text
    void Promise.resolve(question.feedback({ text: textSnapshot })).then((feedbackObject) => {
      if (questionState.mode !== "correct" && questionState.mode !== "incorrect") return
      if (questionState.text !== textSnapshot) return
      questionState.feedbackObject = feedbackObject
    })
  })
</script>

<InteractWithQuestion
  {permalink}
  name={question.name}
  {regenerate}
  footerMode={questionState.mode}
  footerMessage={messageList}
  handleFooterClick={handleClick}
>
  <Markdown md={question.text ?? ""} />
  <br />
  <br />
  <div class="flex place-items-center gap-2 pl-3">
    <Markdown md={question.prompt ?? ""} />
    <input
      class="${inputClass}"
      bind:this={userInputRef}
      disabled={questionState.mode === "correct" || questionState.mode === "incorrect"}
      value={questionState.text}
      oninput={handleChange}
      type="text"
      placeholder={question.placeholder}
    />
    <div class={`flex h-12 items-center ${msgColor}`}>
      <div>
        <Markdown md={questionState.formatFeedback ?? ""} />
      </div>
    </div>
  </div>
  <div class="py-5 text-slate-600 dark:text-slate-400">
    <Markdown md={question.bottomText ?? ""} />
  </div>
  <div class="flex flex-wrap gap-2">
    {#each question.typingAid ?? [] as el (el.label)}
      <Button
        variant="secondary"
        onclick={() => insertText(el.input)}
        aria-label={t("typing-aid.label", [el.label])}
      >
        <Markdown md={el.text ?? ""} />
      </Button>
    {/each}
  </div>
</InteractWithQuestion>

{#snippet messageList()}
  <div class="flex-col">
    {#if questionState.mode === "correct"}
      {@render correct()}
    {:else if questionState.mode === "incorrect"}
      {#if questionState.feedbackObject?.feedbackText}
        {@render feedbackText()}
      {/if}
      {#if questionState.feedbackObject?.correctAnswer}
        {@render correctAnswer()}
      {/if}
    {:else}
      {@render incorrect()}
    {/if}
  </div>
{/snippet}

{#snippet correct()}
  <b class="text-2xl">{t("feedback.correct")}</b>
{/snippet}

{#snippet incorrect()}
  <b class="text-2xl">{t("incorrect")}</b>
{/snippet}

{#snippet feedbackText()}
  <Markdown md={questionState.feedbackObject?.feedbackText ?? ""} />
  <br />
{/snippet}

{#snippet correctAnswer()}
  <b class="text-xl">{t("feedback.possible-correct-solution")}:</b>
  <br />
  <Markdown md={questionState.feedbackObject?.correctAnswer ?? ""} />
{/snippet}

<svelte:window on:keydown={onKeyDown} />
