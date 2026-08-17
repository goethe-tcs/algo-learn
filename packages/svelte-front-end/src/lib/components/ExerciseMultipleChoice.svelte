<script lang="ts">
  import SortableList, { type Item } from "$lib/components/DnD/SortableList.svelte"
  import InteractWithQuestion from "$lib/components/InteractWithQuestion.svelte"
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import type { MODE, Result } from "$lib/components/types.ts"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { Tooltip } from "bits-ui"
  import CheckCheck from "@lucide/svelte/icons/check-check"
  import CircleX from "@lucide/svelte/icons/circle-x"
  import type { Language } from "@shared/api/Language.ts"
  import type { MultipleChoiceFeedback, MultipleChoiceQuestion } from "@shared/api/QuestionGenerator.ts"
  import { tFunction } from "@shared/utils/translations.ts"

  interface Props {
    question: MultipleChoiceQuestion
    permalink?: string
    onResult?: (result: Result, finished: boolean) => void
    regenerate?: () => void
  }

  const { question, permalink, onResult, regenerate }: Props = $props()
  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))
  const questionState: {
    mode: MODE
    choice: Array<number>
    feedbackObject?: MultipleChoiceFeedback
  } = $state({
    mode: "invalid",
    choice: [],
  })
  const disabled: boolean = $derived(
    questionState.mode === "correct" || questionState.mode === "incorrect",
  )

  $effect(() => {
    questionState.mode = question.sorting ? "draft" : "invalid"
    questionState.choice = question.sorting ? [...Array(question.answers.length).keys()] : []
    questionState.feedbackObject = undefined
  })

  /**
   * SetChoice sets the entire choice array.
   *
   * @param newChoice The new choice array
   */
  function setChoice(newChoice: Array<number>): void {
    questionState.choice = newChoice
  }

  /**
   * SetChoiceEntry sets the choice for a single entry.
   *
   * @param key The index of the entry
   * @param value Whether the entry should be chosen
   */
  function setChoiceEntry(key: number, value: boolean): void {
    const newChoice = question.allowMultiple ? questionState.choice.filter((x) => x !== key) : []
    if (value) {
      newChoice.push(key)
    }
    questionState.mode = newChoice.length === 0 ? "invalid" : "draft"
    questionState.choice = newChoice.sort()
  }

  function handleClick(finished: boolean) {
    if (questionState.mode === "draft") {
      if (question.feedback !== undefined) {
        questionState.mode = "submitted"
        void Promise.resolve(question.feedback({ choice: questionState.choice })).then(
          (feedbackObject) => {
            let mode: MODE = "draft"
            if (feedbackObject.correct === true) {
              mode = "correct"
            } else if (feedbackObject.correct === false) {
              mode = "incorrect"
            }
            questionState.mode = mode
            questionState.feedbackObject = feedbackObject
          },
        )
      }
    } else if (questionState.mode === "correct" || questionState.mode === "incorrect") {
      if (onResult) {
        onResult(questionState.mode, finished)
      }
    }
  }

  function onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent)) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === "Enter") {
      e.preventDefault()
      handleClick(false)
      return
    }
    if (questionState.mode === "correct" || questionState.mode === "incorrect") return

    if (!question.sorting) {
      const num = parseInt(e.key)
      if (!Number.isNaN(num) && num >= 1 && num <= question.answers.length) {
        e.preventDefault()
        const id = num - 1 // answers[num - 1].key
        setChoiceEntry(id, !questionState.choice.includes(id))
        return
      }
    }
  }

  const messageListIncludes: { correct: boolean; feedback: boolean } = $derived({
    correct: questionState.mode === "correct",
    feedback: questionState.feedbackObject?.feedbackText !== "",
  })

  const initItems: Item[] = $derived(
    questionState.choice.map((position) => {
      return {
        id: "u" + position,
        position,
        content: question.answers[position],
      }
    }),
  )
  const onChange = (newItems: Array<Item>) => setChoice(newItems.map((item) => item.position))

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
</script>

{#if !question.sorting}
  <InteractWithQuestion
    {permalink}
    name={question.name}
    {regenerate}
    footerMode={questionState.mode}
    footerMessage={messageList}
    handleFooterClick={handleClick}
    {disabled}
  >
    <Markdown md={question.text ?? ""} />
    <div class="flex flex-col flex-wrap gap-4 p-4">
      {#each question.answers as answer, index (index)}
        <div class="flex items-center space-x-2">
          {@render FeedbackIconAndTooltip(
            true === questionState.feedbackObject?.correctChoice?.includes(index),
            (true === questionState.feedbackObject?.correctChoice?.includes(index)) ===
              questionState.choice.includes(index),
            !disabled,
          )}
          <Checkbox
            id={index.toString()}
            checked={questionState.choice.includes(index)}
            {disabled}
            onCheckedChange={() => {
              setChoiceEntry(index, !questionState.choice.includes(index))
            }}
          />
          <div class="grid gap-1.5 leading-none">
            <Label>
              <Markdown md={answer} />
            </Label>
          </div>
        </div>
      {/each}
    </div>
  </InteractWithQuestion>
{:else}
  <InteractWithQuestion
    {permalink}
    name={question.name}
    {regenerate}
    footerMode={questionState.mode}
    footerMessage={messageList}
    handleFooterClick={handleClick}
    {disabled}
  >
    <Markdown md={question.text ?? ""} />
    <SortableList {initItems} {onChange} {disabled} />
  </InteractWithQuestion>
{/if}

{#snippet messageList()}
  <div class="flex-col">
    {#if messageListIncludes.correct}
      {@render correct()}
    {:else if questionState.feedbackObject?.correctChoice}
      {#if !question.sorting}
        {@render correctSolution()}
      {:else}
        {@render correctSolutionSort()}
      {/if}
    {:else}
      {@render incorrect()}
    {/if}
    {#if messageListIncludes.feedback}
      {@render feedbackText()}
    {/if}
  </div>
{/snippet}

{#snippet correct()}
  <b class="text-2xl">{t("feedback.correct")}</b>
{/snippet}

{#snippet incorrect()}
  <b class="text-2xl">{t("incorrect")}</b>
{/snippet}

{#snippet correctSolution()}
  <b class="text-xl">{t("correct.solution")}:</b>&nbsp;{t("see.above")}
  <br />
{/snippet}

{#snippet feedbackText()}
  <Markdown md={questionState.feedbackObject?.feedbackText ?? ""} />
{/snippet}

{#snippet correctSolutionSort()}
  <b class="text-xl">{t("feedback.thats-ok")}:</b>
  &nbsp;
  <Markdown
    md={t("feedback.correct-order", [
      `${questionState.feedbackObject?.correctChoice?.map((i) => "\n|" + question.answers[i] + "|").join("")}\n`,
    ])}
  />
  <br />
{/snippet}

{#snippet FeedbackIconAndTooltip(
  isCorrectAnswer: boolean,
  userGaveCorrectAnswer: boolean,
  hidden: boolean,
)}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {@render FeedbackIcon(isCorrectAnswer, hidden)}
      </Tooltip.Trigger>
      <Tooltip.Content>
        {#if questionState.mode === "correct" || questionState.mode === "incorrect"}
          {isCorrectAnswer ? t("answer.correct") : t("answer.wrong")}
          <br />
          {userGaveCorrectAnswer ? t("choice.correct") : t("choice.wrong")}
        {/if}
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{/snippet}

{#snippet FeedbackIcon(correct: boolean, hidden: boolean)}
  {#if correct}
    <CheckCheck class={"h-4 w-4 text-green-700" + (hidden ? " invisible" : "")} />
  {:else}
    <CircleX class={"h-4 w-4 text-red-700" + (hidden ? " invisible" : "")} />
  {/if}
{/snippet}

<svelte:window on:keydown={onKeyDown} />
