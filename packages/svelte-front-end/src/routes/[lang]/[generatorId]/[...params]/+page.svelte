<script lang="ts">
  import { goto } from "$app/navigation"
  import { resolve } from "$app/paths"
  import { page } from "$app/state"
  import type { Result } from "$lib/components/types.ts"
  import { Button } from "$lib/components/ui/button"
  import ViewSingleQuestion from "$lib/components/ViewSingleQuestion.svelte"
  import { globalTranslations } from "$lib/translation.ts"
  import { getLanguage } from "$lib/utils/langState.svelte.ts"
  import { collection } from "@settings/questionsSelection.ts"
  import { allParameterCombinations, type Parameters } from "@shared/api/Parameters.ts"
  import type { QuestionGenerator } from "@shared/api/QuestionGenerator.ts"
  import { deserializePath } from "@shared/api/QuestionRouter.ts"
  import Random, { sampleRandomSeed } from "@shared/utils/random.ts"
  import { tFunction, type Translations } from "@shared/utils/translations.ts"
  import CenteredDivs from "@/lib/components/centeredDivs.svelte"

  const localTranslations: Translations = {
    en: {
      completeHeading: "Session summary",
      totalLabel: "Total answered",
      correctLabel: "Correct answers",
      incorrectLabel: "Incorrect answers",
      accuracyLabel: "Accuracy",
    },
    de: {
      completeHeading: "Zusammenfassung",
      totalLabel: "Antworten insgesamt",
      correctLabel: "Richtige Antworten",
      incorrectLabel: "Falsche Antworten",
      accuracyLabel: "Genauigkeit",
    },
  }

  const lang = $derived(getLanguage())
  const { t: tGlobal } = $derived(tFunction([globalTranslations], lang))
  const { t: tLocal } = $derived(tFunction([localTranslations], lang))

  const path =
    page.params.lang +
    "/" +
    page.params.generatorId +
    (page.params.params ? "/" + page.params.params : "")
  const deserializedPath = deserializePath({
    collection,
    path,
    expectLang: true,
  })

  if (!deserializedPath) throw new Error("Parsing the url went wrong!")

  const generator = deserializedPath.generator

  const generatorCalls: {
    generator: QuestionGenerator
    parameters: Parameters
  }[] = []

  const questionState = $state({
    numCorrect: 0,
    numIncorrect: 0,
    aborted: false,
  })

  const random = new Random(`${sampleRandomSeed()}`)
  random.shuffle(generatorCalls)

  let sessionSeed = $state(sampleRandomSeed())
  function nextSeed() {
    sessionSeed = deserializedPath!.seed ? deserializedPath!.seed : sampleRandomSeed()
  }
  const currSeed = $derived(deserializedPath.seed ? deserializedPath.seed : sessionSeed)

  let status: "running" | "finished" | "aborted" = $state("running")
  function updateStatus(finished: boolean) {
    status = questionState.aborted ? "aborted" : finished ? "finished" : "running"
  }

  function updateCallList() {
    if (status === "running") {
      if (generatorCalls.length === questionState.numCorrect + questionState.numIncorrect) {
        if (deserializedPath!.parameters) {
          generatorCalls.push({
            generator,
            parameters: deserializedPath!.parameters,
          })
        } else {
          random.shuffle(allParameterCombinations(generator.expectedParameters)).map((parameters) => {
            generatorCalls.push({
              generator,
              parameters,
            })
          })
        }
      }
    }
  }
  updateCallList()

  const counts = $derived({
    total: questionState.numCorrect + questionState.numIncorrect,
    correct: questionState.numCorrect,
    incorrect: questionState.numIncorrect,
  })

  const accuracy = $derived(counts.total ? Math.round((counts.correct / counts.total) * 100) : 0)
  function accuracyToneClass(value: number) {
    if (value >= 90)
      return "border-2 border-emerald-500/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-400/70 dark:bg-emerald-900/25 dark:text-emerald-50"
    if (value >= 70)
      return "border-2 border-lime-500/70 bg-lime-50/70 text-lime-900 dark:border-lime-400/70 dark:bg-lime-900/25 dark:text-lime-50"
    if (value >= 40)
      return "border-2 border-amber-500/70 bg-amber-50/70 text-amber-900 dark:border-amber-400/70 dark:bg-amber-900/25 dark:text-amber-50"
    return "border-2 border-red-500/70 bg-red-50/70 text-red-900 dark:border-red-400/70 dark:bg-red-900/25 dark:text-red-50"
  }
  const accuracyClasses = $derived(accuracyToneClass(accuracy))

  const baseCountdownMs = 5000
  let countdownMs = $state(baseCountdownMs)
  let isPaused = $state(false)

  const progress = $derived(
    Math.min(100, Math.max(0, ((baseCountdownMs - countdownMs) / baseCountdownMs) * 100)),
  )

  $effect(() => {
    if (status === "finished") {
      countdownMs = baseCountdownMs
      isPaused = false
    }
  })

  $effect(() => {
    if (status !== "finished" || isPaused) return

    const start = performance.now()
    const startRemaining = countdownMs
    let raf: number

    const step = (ts: number) => {
      const next = Math.max(0, startRemaining - (ts - start))
      countdownMs = next

      if (next === 0 && !isPaused && status === "finished") {
        handleContinue()
        return
      }

      if (!isPaused && status === "finished") {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  })

  const handleContinue = () => {
    goto(resolve(`/${getLanguage()}`))
  }

  const handleResult = (result: Result, finished: boolean) => {
    if (result === "correct") {
      questionState.numCorrect += 1
      updateStatus(finished)
    } else if (result === "incorrect") {
      questionState.numIncorrect += 1
      updateStatus(finished)
    } else if (result === "abort" || result === "timeout") {
      questionState.aborted = true
    }
    nextSeed()
    updateCallList()
  }

  const currObj = $derived(generatorCalls[questionState.numCorrect + questionState.numIncorrect])
</script>

{#if status === "aborted"}
  <CenteredDivs variant="screen">
    <div class="w-full rounded-xl bg-black/10 p-16 dark:bg-black/20">
      <div class="font-serif text-red-500 italic">{tGlobal("quiz-session-aborted")}</div>
      <Button
        href={resolve(`/${getLanguage()}`)}
        variant="rightAnswer"
        class="mt-12 ml-auto block max-w-max"
      >
        {tGlobal("Continue")}
      </Button>
    </div>
  </CenteredDivs>
{:else if status === "running"}
  <ViewSingleQuestion
    generator={currObj.generator}
    parameters={currObj.parameters}
    seed={currSeed}
    onResult={handleResult}
    regenerate={nextSeed}
  />
{:else}
  <CenteredDivs variant="screen">
    <div
      class="mx-auto w-full max-w-4xl rounded-2xl bg-white/80 p-10 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-black/40 dark:ring-white/10"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-3">
          <div class="text-2xl font-semibold text-gray-900 dark:text-white">
            {tLocal("completeHeading")}
          </div>
          <div
            class={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-black/10 transition-colors dark:ring-white/10 ${accuracyClasses}`}
          >
            <span>{tLocal("accuracyLabel")}</span>
            <span>{accuracy}%</span>
          </div>
        </div>
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <div
          class="rounded-xl border border-black/5 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30"
        >
          <div class="text-xs tracking-wide text-gray-600 uppercase dark:text-gray-300">
            {tLocal("totalLabel")}
          </div>
          <div class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{counts.total}</div>
        </div>
        <div
          class="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm ring-1 ring-green-200/70 backdrop-blur dark:border-green-800/60 dark:bg-green-900/30 dark:ring-green-700/50"
        >
          <div class="text-xs tracking-wide text-green-800 uppercase dark:text-green-100">
            {tLocal("correctLabel")}
          </div>
          <div class="mt-2 text-3xl font-semibold text-green-800 dark:text-green-50">
            {counts.correct}
          </div>
        </div>
        <div
          class="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm ring-1 ring-red-200/70 backdrop-blur dark:border-red-800/60 dark:bg-red-900/30 dark:ring-red-700/50"
        >
          <div class="text-xs tracking-wide text-red-800 uppercase dark:text-red-100">
            {tLocal("incorrectLabel")}
          </div>
          <div class="mt-2 text-3xl font-semibold text-red-800 dark:text-red-50">{counts.incorrect}</div>
        </div>
      </div>
      <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          href={resolve(`/${getLanguage()}`)}
          variant="rightAnswer"
          class="relative ml-auto flex items-center gap-3 overflow-hidden"
          style={`--progress:${progress}%`}
          onclick={(e) => {
            e.preventDefault()
            handleContinue()
          }}
          onmouseenter={() => (isPaused = true)}
          onfocus={() => (isPaused = true)}
          ontouchstart={() => (isPaused = true)}
        >
          <span
            class="absolute inset-0 origin-left bg-green-500/30 dark:bg-green-400/20"
            style={`transform: scaleX(${(isPaused ? 100 : progress) / 100}); transition: transform 100ms linear;`}
            aria-hidden="true"
          ></span>
          <span class="relative z-10 flex items-center gap-3">
            {tGlobal("Continue")}
          </span>
        </Button>
      </div>
    </div>
  </CenteredDivs>
{/if}

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Enter") {
      if (status !== "running") {
        window.location.href = resolve(`/${getLanguage()}`)
      }
    }
  }}
/>
