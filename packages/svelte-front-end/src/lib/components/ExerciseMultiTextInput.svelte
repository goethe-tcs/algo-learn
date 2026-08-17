<script lang="ts">
  import InteractWithQuestion from "$lib/components/InteractWithQuestion.svelte"
  import Markdown from "$lib/components/markdown/markdown.svelte"
  import {
    ADD_TEXTFIELDS_AFTERWARDS,
    type FormContextValue,
    type MODE,
    type Result,
    type TextFieldState,
  } from "$lib/components/types.ts"
  import { setTextFieldStateValues } from "$lib/context/textFieldStateValues.ts"
  import { globalTranslations } from "$lib/translation.ts"
  import { isMobileOrTablet } from "$lib/utils/deviceInformation"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { getInputFields, getInputFieldValues } from "$lib/utils/MultiTextInput.ts"
  import type { Language } from "@shared/api/Language.ts"
  import type { FreeTextFeedback, MultiFreeTextQuestion } from "@shared/api/QuestionGenerator.ts"
  import { tFunction } from "@shared/utils/translations.ts"

  interface Props {
    question: MultiFreeTextQuestion
    permalink?: string
    onResult?: (result: Result, finished: boolean) => void
    regenerate?: () => void
  }
  const { question, permalink, onResult, regenerate }: Props = $props()
  const lang: Language = $derived(getLanguage())
  const { t } = $derived(tFunction([globalTranslations], lang))

  const fieldValues = $derived(getInputFields(question.text ? question.text : ""))

  const questionState: {
    mode: MODE
    modeID: { [key: string]: MODE }
    text: { [key: string]: string }
    feedbackObject?: FreeTextFeedback
    formatFeedback: { [key: string]: string }
  } = $state({
    mode: "invalid",
    modeID: {},
    text: {},
    formatFeedback: {},
  })

  $effect(() => {
    questionState.mode = !question.fillOutAll ? "draft" : "invalid"
    for (const id of fieldValues.inputIds) {
      if (!questionState.text[id]) {
        questionState.text[id] = ""
        questionState.modeID[id] = "initial"
        questionState.formatFeedback[id] = ""
      }
    }
  })

  const textFieldStateValues: { [p: string]: TextFieldState } = $derived(
    fieldValues.inputIds.reduce<{ [key: string]: TextFieldState }>((acc, id, i) => {
      acc[id] = {
        text: questionState.text[id],
        type: fieldValues.inputTypes[i],
        prompt: fieldValues.inputPrompts[i],
        feedbackVariation: fieldValues.inputFeedbackVariations[i],
        setText: (text: string) => setText(id, text),
        placeholder: fieldValues.inputPlaceholders[i],
        invalid: questionState.modeID[id] === "invalid",
        disabled: questionState.mode === "correct" || questionState.mode === "incorrect",
        feedback: questionState.formatFeedback[id],
        focus: i === 0 && !isMobileOrTablet,
      }
      return acc
    }, {}),
  )

  setTextFieldStateValues(() => textFieldStateValues)

  function checkOverallMode(currentModeIDs: { [x: string]: string }) {
    if (!question.fillOutAll) return "draft"
    // if every mode in modeID is draft, the overall mode is draft too
    for (const value of Object.values(currentModeIDs)) {
      if (value === "invalid") {
        return "invalid"
      }
      if (value === "initial" && question.fillOutAll) {
        return "invalid"
      }
    }
    return "draft"
  }

  function applyValidation(fieldID: string, value: string, valid: boolean) {
    questionState.text[fieldID] = value
    questionState.modeID[fieldID] = valid ? "draft" : value === "" ? "initial" : "invalid"
    questionState.mode = checkOverallMode({
      ...questionState.modeID,
    })
  }

  function setText(fieldID: string, value: string) {
    questionState.text[fieldID] = value
    if (question.checkFormat) {
      void Promise.resolve(
        question.checkFormat({ text: { ...questionState.text, [fieldID]: value } }, fieldID),
      ).then(({ valid, message }) => {
        applyValidation(fieldID, value, valid)
        questionState.formatFeedback[fieldID] = !valid ? (message ?? "") : ""
      })
    } else {
      const valid = value.trim().length > 0 || !question.fillOutAll
      // todo this Promise makes the check button update correctly but it seems to be a workaround
      //  for a structural issue.
      void Promise.resolve().then(() => {
        applyValidation(fieldID, value, valid)
      })
    }
  }

  function handleClick(finished: boolean) {
    if (questionState.mode === "draft") {
      if (question.feedback !== undefined) {
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

  $effect(() => {
    void lang
    if (question.feedback === undefined) return
    if (questionState.mode !== "correct" && questionState.mode !== "incorrect") return
    const textSnapshot = { ...questionState.text }
    void Promise.resolve(question.feedback({ text: textSnapshot })).then((feedbackObject) => {
      if (questionState.mode !== "correct" && questionState.mode !== "incorrect") return
      questionState.feedbackObject = feedbackObject
    })
  })
  const fieldValues = getInputFields(question.text ? question.text : "")

  for (let i = 0; i < fieldValues.inputIds.length; i++) {
    if (!questionState.text[fieldValues.inputIds[i]]) {
      questionState.text[fieldValues.inputIds[i]] = ""
      questionState.modeID[fieldValues.inputIds[i]] = "initial"
      questionState.formatFeedback[fieldValues.inputIds[i]] = ""
    }
  }

  let textFieldStateValues: { [p: string]: TextFieldState } = $derived(
    fieldValues.inputIds.reduce<{ [key: string]: TextFieldState }>((acc, id, i) => {
      acc[id] = {
        text: questionState.text[id],
        type: fieldValues.inputTypes[i],
        prompt: fieldValues.inputPrompts[i],
        feedbackVariation: fieldValues.inputFeedbackVariations[i],
        setText: (text: string) => setText(id, text),
        placeholder: fieldValues.inputPlaceholders[i],
        invalid: questionState.modeID[id] === "invalid",
        disabled: questionState.mode === "correct" || questionState.mode === "incorrect",
        feedback: questionState.formatFeedback[id],
        focus: i === 0 && !isMobileOrTablet,
      }
      return acc
    }, {}),
  )

  function addTextFieldAfterwards(inputField: string) {
    const singleFieldValues = getInputFieldValues([inputField])
    fieldValues.inputIds.push(singleFieldValues.inputIds[0])
    fieldValues.inputTypes.push(singleFieldValues.inputTypes[0])
    fieldValues.inputPrompts.push(singleFieldValues.inputPrompts[0])
    fieldValues.inputFeedbackVariations.push(singleFieldValues.inputFeedbackVariations[0])
    fieldValues.inputPlaceholders.push(singleFieldValues.inputPlaceholders[0])
    const newId = singleFieldValues.inputIds[0]
    const idx = fieldValues.inputIds.length - 1

    textFieldStateValues[newId] = {
      text: questionState.text[newId],
      type: fieldValues.inputTypes[idx],
      prompt: fieldValues.inputPrompts[idx],
      feedbackVariation: fieldValues.inputFeedbackVariations[idx],
      setText: (text: string) => setText(newId, text),
      placeholder: fieldValues.inputPlaceholders[idx],
      invalid: questionState.modeID[newId] === "invalid",
      disabled: questionState.mode === "correct" || questionState.mode === "incorrect",
      feedback: questionState.formatFeedback[newId],
      focus: !isMobileOrTablet,
    }

    // make reactive in Svelte
    textFieldStateValues = { ...textFieldStateValues }
  }

  // Provide both
  setContext<FormContextValue>(ADD_TEXTFIELDS_AFTERWARDS, {
    get textFieldStateValues() {
      return textFieldStateValues
    },
    addTextFieldAfterwards,
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
