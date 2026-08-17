<script lang="ts">
  import ExerciseMatching from "$lib/components/ExerciseMatching.svelte"
  import ExerciseMultipleChoice from "$lib/components/ExerciseMultipleChoice.svelte"
  import ExerciseMultiTextInput from "$lib/components/ExerciseMultiTextInput.svelte"
  import ExerciseTextInput from "$lib/components/ExerciseTextInput.svelte"
  import type { Result } from "$lib/components/types.ts"
  import type { Question } from "@shared/api/QuestionGenerator.ts"

  interface Props {
    question: Question
    onResult?: (result: Result, finished: boolean) => void
    regenerate?: () => void
  }
  const { question, onResult, regenerate }: Props = $props()
</script>

{#key question.path}
  {#if question.type === "MatchingQuestion"}
    <ExerciseMatching {question} permalink={question.path} {onResult} {regenerate} />
  {:else if question.type === "MultipleChoiceQuestion"}
    <ExerciseMultipleChoice {question} permalink={question.path} {onResult} {regenerate} />
  {:else if question.type === "FreeTextQuestion"}
    <ExerciseTextInput {question} permalink={question.path} {onResult} {regenerate} />
  {:else if question.type === "MultiFreeTextQuestion"}
    <ExerciseMultiTextInput {question} permalink={question.path} {onResult} {regenerate} />
  {:else}
    <b>Unsupported question type.</b>
  {/if}
{/key}
