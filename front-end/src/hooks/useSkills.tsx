import Random from "../../../shared/src/utils/random"
import { FunctionComponent, useMemo } from "react"
import useLocalStorageState from "use-local-storage-state"
import { TFunction } from "i18next"

import {
  computeStrength,
  SkillFeatures as BasicSkillFeatures,
  SkillFeaturesAndPredictions as SkillFeatures,
  SkillFeaturesAndPredictions,
} from "../utils/memory-model"
import { min } from "../../../shared/src/utils/math"

import { Result } from "../components/QuestionComponent"
import {
  allQuestionGeneratorRoutes,
  generatorSetBelowPath,
} from "../listOfQuestions"
import {
  deserializePath,
  serializeGeneratorCall,
} from "../../../shared/src/api/QuestionRouter"
import { Parameters } from "../../../shared/src/api/Parameters"
import { QuestionGenerator } from "../../../shared/src/api/QuestionGenerator"

export type OldQuestionProps = {
  variant: string
  seed: string
  t: TFunction
  onResult: (result: Result) => void
  regenerate?: () => void
  viewOnly?: boolean
}

export interface OldQuestionGenerator {
  path: string
  variants: string[]
  examVariants: string[]
  title: string
  description?: string
  Component: FunctionComponent<OldQuestionProps>
}

export interface OldQuestionVariant {
  question: OldQuestionGenerator
  variant: string
}

/** List of all valid (question,variant) pairs */
// export const ALL_SKILLS: OldQuestionVariant[] =
//   listOfOldQuestionGenerators.flatMap((q) =>
//     q.variants.map((v) => ({
//       question: q,
//       variant: v,
//     }))
//   )

// export const EXAM_SKILLS: OldQuestionVariant[] =
//   listOfOldQuestionGenerators.flatMap((q) =>
//     q.examVariants.map((v) => ({
//       question: q,
//       variant: v,
//     }))
//   )

/** Return the path corresponding to a question variant */
export function pathOfQuestionVariant(qv: OldQuestionVariant): string {
  return qv.question.path + "/" + qv.variant
}

/** Old format for log entries */
type LogEntryV0 = {
  question: string // example: "asymptotics/sum"
  variant: string // example: "pure"
  seed: string // example: "myseed"
  result: "pass" | "fail"
  timestamp: number // as returned by Date.now()
}

/** V1 format for log entries */
export type LogEntryV1 = {
  /**
   * The path is generated by serializeGeneratorCall(..) and is of the form
   * "asymptotics/sum/pure/myseed" (note that the language is not part of the
   * path here)
   */
  path: string

  /** Whether the question was answered correctly */
  result: "pass" | "fail"

  /** When the question was answered (as returned by Date.now()) */
  timestamp: number
}

/**
 * Upgrade a log entry from V0 to V1
 *
 * @param e Log entry in V0 format
 * @returns Log entry in V1 format
 */
function upgradeV0ToV1(e: LogEntryV0): LogEntryV1 {
  return {
    path: e.question + "/" + e.variant + "/" + e.seed,
    result: e.result,
    timestamp: e.timestamp,
  }
}

// const initialLogExample = [
//   {
//     question: "asymptotics/sort",
//     variant: "pure",
//     seed: "skkpjd93",
//     result: "pass",
//     timestamp: Date.now() - 24 * 3600 * 1000,
//   },
//   {
//     question: "asymptotics/sort",
//     variant: "start",
//     seed: "jd930jz",
//     result: "fail",
//     timestamp: Date.now() - 400000,
//   },
//   {
//     question: "asymptotics/sort",
//     variant: "start",
//     seed: "skm93js",
//     result: "pass",
//     timestamp: Date.now() - 200000,
//   },
//   {
//     question: "asymptotics/sort",
//     variant: "start",
//     seed: "82sjh9w",
//     result: "pass",
//     timestamp: Date.now() - 100,
//   },
//   {
//     question: "asymptotics/sort",
//     variant: "start",
//     seed: "skkpjd93",
//     result: "pass",
//     timestamp: Date.now() - 29,
//   },
// ]

function byDescendingTimestamp(a: LogEntryV1, b: LogEntryV1) {
  return b.timestamp - a.timestamp
}

/** Upgrade the log if necessary and return the most recent version of the log. */
export function useLog() {
  const [logV0, setLogV0] = useLocalStorageState("log", {
    defaultValue: [] as Array<LogEntryV0>,
    storageSync: false,
  })
  const [logV1, setLogV1] = useLocalStorageState("log-v1", {
    defaultValue: [] as Array<LogEntryV1>,
    storageSync: true,
  })

  if (logV0.length > 0) {
    console.log("The log in storage will now be upgraded from v0 to v1...")
    setLogV1(logV1.concat(logV0.map(upgradeV0ToV1)).sort(byDescendingTimestamp))
    setLogV0([])
  }

  const log: Array<LogEntryV1> = logV1.sort(byDescendingTimestamp)
  // .filter(
  //   (e) => questionVariantByPath(e.question + "/" + e.variant) !== undefined
  // )
  for (let i = 0; i < log.length; i++) {
    if (logV1[i].timestamp !== log[i].timestamp) {
      console.log("Warning: The log in storage was not sorted... fixing it!")
      setLogV1(log)
      break
    }
  }
  for (let i = 0; i < log.length - 1; i++) {
    console.assert(
      log[i + 1].timestamp < log[i].timestamp,
      "Invariant failed: Each timestamp in the log must be unique!"
    )
  }
  return { log, setLog: setLogV1 }
}

/** Return the progress of the user */
export function useSkills() {
  const { log, setLog } = useLog()

  /* Compute the basic features of each skill (e.g., how often pass/fail?) */
  const basicFeatureMap = computeBasicFeatureMap({ log })

  /* Compute the strength of each skill (number between 0 and 1) */
  const featureMap = useMemo(
    () => computeFeatureMap({ basicFeatureMap }),
    [basicFeatureMap]
  )

  const unlockedSkills = useMemo(
    () => computeUnlockedSkills({ featureMap }),
    [featureMap]
  )

  function appendLogEntry(entry: LogEntryV1) {
    const newLog = log.slice()
    newLog.push(entry)
    setLog(newLog)
  }

  function clearLog() {
    setLog([])
  }

  return {
    featureMap,
    unlockedSkills,
    log,
    appendLogEntry,
    clearLog,
  }
}

/**
 * Computes the feature vector for all question variants
 *
 * @param props
 * @param props.log A user's full history
 * @returns The feature vector
 */
function computeBasicFeatureMap({ log }: { log: Array<LogEntryV1> }): {
  [path: string]: BasicSkillFeatures
} {
  const qualifyingPasses: { [path: string]: number } = {}
  const featureMap: { [path: string]: BasicSkillFeatures } = {}
  for (const { generator, parameters } of generatorSetBelowPath("")) {
    const path = serializeGeneratorCall({ generator, parameters })
    qualifyingPasses[path] = 0
    featureMap[path] = {
      mastered: false,
      numPassed: 0,
      numFailed: 0,
      lag: Infinity,
    }
  }

  const now = Date.now()
  for (const e of log.slice().reverse()) {
    const generatorCall = deserializePath({
      routes: allQuestionGeneratorRoutes,
      path: e.path,
    })
    if (generatorCall === undefined) {
      console.log(
        `Path ${e.path} was not found in allQuestionGeneratorRoutes. Skipping...`
      )
      continue
    }
    const { generator, parameters } = generatorCall
    const path = serializeGeneratorCall({ generator, parameters })
    featureMap[path].lag = min(
      featureMap[path].lag,
      (now - e.timestamp) / 3600 / 24 / 1000
    )

    /**
     * The mastery threshold is defined on each Question, or a default value of
     * 3 is used. We need at least 3 successive correct answers to "master" a
     * skill, which causes the successors of these skills to be unlocked.
     */
    const minQualifyingPasses = 3

    if (featureMap[path].mastered) {
      if (e.result === "pass") {
        featureMap[path].numPassed += 1
      } else {
        console.assert(e.result === "fail")
        featureMap[path].numFailed += 1
      }
    } else if (qualifyingPasses[path] < minQualifyingPasses) {
      if (e.result === "pass") {
        qualifyingPasses[path] += 1
      } else {
        qualifyingPasses[path] = 0
      }
    }
    if (qualifyingPasses[path] === minQualifyingPasses) {
      featureMap[path].mastered = true
      // featureMap[path].numPassed = Math.max(
      //   featureMap[path].numPassed,
      //   minQualifyingPasses
      // )
    }
  }
  return featureMap
}

/**
 * Computes the strength of each skill
 *
 * @param props
 * @param props.featureMap The feature vector
 * @returns The strength of each skill
 */
function computeFeatureMap({
  basicFeatureMap,
}: {
  basicFeatureMap: {
    [path: string]: BasicSkillFeatures
  }
}): {
  [path: string]: SkillFeatures
} {
  const featureMap: {
    [path: string]: SkillFeatures
  } = {}
  for (const [path, feature] of Object.entries(basicFeatureMap)) {
    featureMap[path] = computeStrength(feature)
  }
  return featureMap
}

/**
 * Given a strengthMap and a path, compute the average strength of all question
 * variants that exist within that path.
 *
 * @param props
 * @param props.strengthMap The strength of each skill
 * @param props.set The set of generator/parameter combinations to take the
 *   average over
 * @returns The average strength of all variants in the set
 */
export function averageStrength({
  strengthMap,
  set,
}: {
  strengthMap: {
    [path: string]: { p: number; h: number }
  }
  set: Array<{ generator: QuestionGenerator; parameters: Parameters }>
}): number {
  if (set.length === 0) return 0

  let avg = 0
  for (const { generator, parameters } of set) {
    avg += strengthMap[serializeGeneratorCall({ generator, parameters })].p
  }
  return avg / set.length
}
// OLD CODE:
//   if (generator.variants.length === 0) return 0
//   let avg = 0
//   for (const v of generator.variants) {
//     avg += strengthMap[path + "/" + v].p
//   }
//   avg /= generator.variants.length
//   return avg

/**
 * Function that returns all question variants in or below a given path.
 *
 * @param param
 * @param param.path The (partial) path of the skill tree that should be trained
 *   (or examined) in the session. For example, "asymptotics/sum" would train
 *   all variants of the question "sum", whereas "asymptotics/sum/pure" would
 *   only train a single question variant.
 * @param param.mode Determines the mode of the session.
 * @returns A list of question variants that should be trained (or examined) in
 *   the session.
 */
// export function allQuestionVariantsInPath({
//   path,
//   mode = "practice",
// }: {
//   path: string
//   mode: "practice" | "exam"
// }): string[] {
//   const allQuestionVariants =
//     mode === "practice"
//       ? ALL_SKILLS.map(pathOfQuestionVariant)
//       : EXAM_SKILLS.map(pathOfQuestionVariant)
//   return allQuestionVariants.filter((s) => {
//     const skill = s.split("/")
//     const splittedPath = path.split("/")
//     /** Select all questions, when no path is selected */
//     if (splittedPath[0] === "") {
//       return true
//     }
//     for (let i = 0; i < splittedPath.length; i++) {
//       if (splittedPath[i] !== skill[i]) {
//         return false
//       }
//     }
//     return true
//   })
// }

/**
 * Return a list of question variants sorted by strength from lowest to highest
 *
 * @param props
 * @param props.random The random number generator
 * @param props.featureMap The feature map
 * @param props.generatorCalls The list of question variants that should be
 *   sorted. Note that this list will be sorted in-place.
 * @returns The questionVariants list
 */
export function sortByStrength({
  random,
  featureMap,
  generatorCalls,
}: {
  random?: Random
  featureMap: {
    [path: string]: { p: number; h: number }
  }
  generatorCalls: Array<{
    generator: QuestionGenerator
    parameters: Parameters
  }>
}): Array<{
  generator: QuestionGenerator
  parameters: Parameters
}> {
  random?.shuffle(generatorCalls) // If random was provided, shuffle to break ties
  generatorCalls.sort(
    (a, b) =>
      featureMap[serializeGeneratorCall(a)].p -
      featureMap[serializeGeneratorCall(b)].p
  )
  return generatorCalls
}

/**
 * Returns all skills that are already unlocked. A skill unlocks only once all
 * dependencies are above thresholdStrength
 *
 * @param props
 * @param props.featureMap The feature vector
 * @param props.thresholdStrength The threshold for a skill to be considered
 *   unlocked
 * @returns The list of unlocked skills
 */
export function computeUnlockedSkills({
  featureMap,
  thresholdStrength = 0.75,
}: {
  featureMap: {
    [path: string]: SkillFeaturesAndPredictions
  }
  thresholdStrength?: number
}): string[] {
  // for now, we assume all question generators are independent and all variants strictly build on each other.
  const unlockedPaths = []
  for (const { path } of allQuestionGeneratorRoutes) {
    for (const { generator, parameters } of generatorSetBelowPath(path)) {
      const newPath = serializeGeneratorCall({ generator, parameters })
      unlockedPaths.push(newPath)
      if (
        featureMap[newPath].p < thresholdStrength ||
        !featureMap[newPath].mastered
      )
        break
    }
  }
  return unlockedPaths
}
