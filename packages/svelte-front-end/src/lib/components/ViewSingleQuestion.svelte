<script lang="ts">
  import ErrorPage from "$lib/components/ErrorPage.svelte"
  import Loading from "$lib/components/Loading.svelte"
  import QuestionComponent from "$lib/components/QuestionComponent.svelte"
  import type { Result } from "$lib/components/types.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import type { Language } from "@shared/api/Language.ts"
  import type { Parameters } from "@shared/api/Parameters"
  import type { Question, QuestionGenerator } from "@shared/api/QuestionGenerator.ts"

  interface Props {
    generator: QuestionGenerator
    parameters: Parameters
    seed: string
    onResult: ((result: Result, finished: boolean) => void) | undefined
    regenerate: () => void
  }
  const { generator, parameters, seed, onResult, regenerate }: Props = $props()
  const lang: Language = $derived(getLanguage())
  const questionKey = $derived(`${generator.id}:${seed}:${JSON.stringify(parameters)}`)

  let currentQuestion: Question | null = $state(null)
  let error: Error | null = $state(null)
  let fetchId = 0

  $effect(() => {
    const id = ++fetchId
    error = null
    void Promise.resolve(generator.generate(lang, parameters, seed))
      .then((result) => {
        if (id !== fetchId) return
        currentQuestion = result.question
      })
      .catch((err) => {
        if (id !== fetchId) return
        error = err instanceof Error ? err : new Error(String(err))
      })
      .finally(() => {
        if (id !== fetchId) return
      })
  })
</script>

{#if error}
  <ErrorPage mg={error.message} reset={regenerate} />
{:else if currentQuestion}
  {#key questionKey}
    <QuestionComponent question={currentQuestion} {onResult} {regenerate} />
  {/key}
{:else}
  <Loading />
{/if}
