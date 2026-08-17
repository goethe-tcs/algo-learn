<script lang="ts">
  import MatchingExercise from "$lib/components/DnD/MatchingExercise.svelte"
  import type { SlotItem } from "$lib/components/DnD/MatchingSlot.svelte"
  import InteractWithQuestion from "$lib/components/InteractWithQuestion.svelte"
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import type { MODE, Result } from "$lib/components/types.ts"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte"
  import type { Language } from "@shared/api/Language"
  import type { MatchingFeedback, MatchingQuestion } from "@shared/api/QuestionGenerator.ts"
  import { tFunction } from "@shared/utils/translations"

  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))

  interface Props {
    question: MatchingQuestion
    permalink?: string
    onResult?: (result: Result, finished: boolean) => void
    regenerate?: () => void
  }

  const { question, permalink, onResult, regenerate }: Props = $props()

  const questionState: {
    mode: MODE
    choice: number[]
    feedbackObject?: MatchingFeedback
  } = $state({
    mode: "invalid",
    choice: [],
  })

  $effect(() => {
    questionState.mode = question.fillOutAll ? "invalid" : "draft"
    questionState.choice = Array(question.answers.length).fill(-1)
    questionState.feedbackObject = undefined
  })

  const disabled = $derived(questionState.mode === "correct" || questionState.mode === "incorrect")

  // handle fillOutAll mode
  function onModeChange(newMode: MODE) {
    // if already correct/incorrect, don't revert mode
    if (questionState.mode === "correct" || questionState.mode === "incorrect") return
    // otherwise update
    if (question.fillOutAll) {
      questionState.mode = newMode
    }
  }

  // handle submit
  function handleClick(finished: boolean) {
    if (question.feedback && questionState.mode === "draft") {
      void Promise.resolve(question.feedback({ choice: questionState.choice })).then(
        (feedbackObject) => {
          const mode: MODE = feedbackObject.correct ? "correct" : "incorrect"
          questionState.feedbackObject = feedbackObject
          questionState.mode = mode
        },
      )
    } else if (["correct", "incorrect"].includes(questionState.mode)) {
      onResult?.(questionState.mode as Result, finished)
    }
  }

  // handle drag/drop changes
  function onChange(slots: (SlotItem | null)[]) {
    questionState.choice = slots.map((s) => (s ? Number(s.id) : -1))
  }

  function onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent)) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === "Enter") {
      e.preventDefault()
      handleClick(false)
    }
  }

  $effect(() => {
    void lang
    if (question.feedback === undefined) return
    if (questionState.mode !== "correct" && questionState.mode !== "incorrect") return
    const choiceSnapshot = questionState.choice.slice()
    void Promise.resolve(question.feedback({ choice: choiceSnapshot })).then((feedbackObject) => {
      if (questionState.mode !== "correct" && questionState.mode !== "incorrect") return
      questionState.feedbackObject = feedbackObject
    })
  })

  const pairs = $derived(
    (question.fixedItems ?? []).map((f, i) => ({
      id: `${i}`,
      fixed: f,
      answerId: questionState.choice[i] >= 0 ? `${questionState.choice[i]}` : null,
      correctness: questionState.feedbackObject?.rowCorrectness?.[i] ?? null,
    })),
  )

  const answers = $derived(
    question.answers.map((a, i) => ({
      id: `${i}`,
      content: a,
    })),
  )
</script>

<InteractWithQuestion
  {permalink}
  name={question.name}
  {regenerate}
  footerMode={questionState.mode}
  footerMessage={footerMsg}
  handleFooterClick={handleClick}
>
  <Markdown md={question.text ?? ""} />

  <div class="my-5">
    <MatchingExercise
      {pairs}
      {answers}
      {disabled}
      {onChange}
      {onModeChange}
      columns={question.columns}
    />
  </div>
</InteractWithQuestion>

{#snippet footerMsg()}
  <div class="flex-col">
    {#if questionState.mode === "correct"}
      {@render correct()}
    {:else if questionState.mode === "incorrect"}
      {@render incorrect()}
      {#if questionState.feedbackObject?.correctAnswer !== undefined}
        {@render correctAnswer()}
      {/if}
    {:else if questionState.mode === "invalid"}
      <b class="text-lg">{t("feedback.fillOutAll")}</b>
    {:else}
      <b class="text-lg">{t("feedback.tryAgain")}</b>
    {/if}
  </div>
{/snippet}

{#snippet correct()}
  <b class="text-xl">{t("feedback.correct")}</b>
{/snippet}

{#snippet incorrect()}
  <b class="text-xl">{t("feedback.incorrect")}</b>
{/snippet}

{#snippet correctAnswer()}
  <br />
  <Markdown md={questionState.feedbackObject?.correctAnswer ?? ""} />
{/snippet}

<svelte:window on:keydown={onKeyDown} />
