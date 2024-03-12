import { useRef, useState } from "react"
import { FreeTextFeedback, FreeTextQuestion } from "@shared/api/QuestionGenerator.ts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useGlobalDOMEvents from "../hooks/useGlobalDOMEvents"
import { useSound } from "../hooks/useSound"
import { useTranslation } from "../hooks/useTranslation"
import { InteractWithQuestion, MODE } from "./InteractWithQuestion"
import { Markdown } from "./Markdown"
import { Result } from "./QuestionComponent"

/**
 * ExerciseTextInput is an exercise that requires the user to type in text.
 *
 * @param props
 * @param props.question The question.
 * @param props.regenerate Function to regenerate the question.
 * @param props.onResult Function to call when the user submits an answer.
 * @param props.permalink Permalink to the question.
 */
export function ExerciseTextInput({
  question,
  regenerate,
  onResult,
  permalink,
}: {
  question: FreeTextQuestion
  regenerate?: () => void
  onResult?: (result: Result) => void
  permalink?: string
}) {
  const { playSound } = useSound()
  const { t } = useTranslation()

  const [state, setState] = useState<{
    /** The current state of the exercise interaction */
    mode: MODE

    /** The current input text */
    text: string

    /**
     * The feedback object returned by question.feedback(). Will be set when the
     * Promise returned by question.feedback() resolves.
     */
    feedbackObject?: FreeTextFeedback

    /**
     * Message to show when the text is invalid. This is determined by the
     * checkFormat method.
     */
    formatFeedback?: string
  }>({
    mode: "invalid",
    text: "",
  })

  const { mode, text, feedbackObject, formatFeedback } = state

  const userInputRef = useRef<HTMLInputElement>(null)

  function setText(text: string) {
    setState((state) => ({ ...state, text }))
    if (question.checkFormat) {
      void Promise.resolve(question.checkFormat({ text })).then(({ valid, message }) => {
        setState({
          ...state,
          text,
          mode: valid ? "draft" : "invalid",
          formatFeedback: message,
        })
      })
    } else {
      const valid = text.trim().length > 0
      setState({ ...state, text, mode: valid ? "draft" : "invalid" })
    }
  }

  function insertText(text: string): void {
    if (userInputRef.current === null) {
      setText(text)
      return
    }

    setText(
      userInputRef.current.value.slice(0, userInputRef.current.selectionStart ?? 0) +
        text +
        userInputRef.current.value.slice(userInputRef.current.selectionEnd ?? 0),
    )
  }

  function handleClick() {
    if (mode === "draft") {
      if (question.feedback !== undefined) {
        setState({ ...state, mode: "submitted" })
        void Promise.resolve(question.feedback({ text })).then((feedbackObject) => {
          let mode: MODE = "draft"
          if (feedbackObject.correct === true) {
            playSound("pass")
            mode = "correct"
          } else if (feedbackObject.correct === false) {
            playSound("fail")
            mode = "incorrect"
          }
          setState({ ...state, mode, feedbackObject })
        })
      }
    } else if (mode === "correct" || mode === "incorrect") {
      onResult && onResult(mode)
    }
  }

  useGlobalDOMEvents({
    keydown(e: Event) {
      if (!(e instanceof KeyboardEvent)) {
        return
      }
      const key = e.key
      if (key === "Enter") {
        e.preventDefault()
        handleClick()
      }
    },
  })

  const msgColor =
    mode === "draft" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
  const message =
    mode === "correct" ? (
      <b className="text-2xl">{t("feedback.correct")}</b>
    ) : mode === "incorrect" ? (
      [
        feedbackObject?.feedbackText ? (
          <>
            <Markdown md={feedbackObject.feedbackText} />
            <br />
          </>
        ) : null,
        feedbackObject?.correctAnswer ? (
          <>
            <b className="text-xl">{t("feedback.possible-correct-solution")}:</b>
            <br />
            <Markdown md={feedbackObject.correctAnswer} />
          </>
        ) : (
          <b className="text-2xl">{t("feedback.incorrect")}</b>
        ),
      ]
    ) : null

  return (
    <InteractWithQuestion
      permalink={permalink}
      name={question.name}
      regenerate={regenerate}
      footerMode={mode}
      footerMessage={message}
      handleFooterClick={handleClick}
    >
      <Markdown md={question.text} />
      <br />
      <br />
      <div className="flex place-items-center gap-2 pl-3">
        <Markdown md={question.prompt} />
        <Input
          ref={userInputRef}
          autoFocus
          disabled={mode === "correct" || mode === "incorrect"}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          type="text"
          placeholder={question.placeholder}
        />
        <div className={`flex h-12 items-center ${msgColor}`}>
          <div>
            <Markdown md={formatFeedback} />
          </div>
        </div>
      </div>
      <div className="py-5 text-slate-600 dark:text-slate-400">
        <Markdown md={question.bottomText} />
      </div>
      {(question.typingAid ?? []).map((el, index) => (
        <Button variant="secondary" key={`ta-${index}`} onClick={() => insertText(el.input)}>
          <Markdown md={el.text} />
        </Button>
      ))}
    </InteractWithQuestion>
  )
}
