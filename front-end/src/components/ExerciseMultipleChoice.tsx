import { CheckCheck, XCircle } from "lucide-react"
import { useState } from "react"
import { Tooltip } from "react-tooltip"
import { MultipleChoiceFeedback, MultipleChoiceQuestion } from "@shared/api/QuestionGenerator"
import useGlobalDOMEvents from "../hooks/useGlobalDOMEvents"
import { useSound } from "../hooks/useSound"
import { useTranslation } from "../hooks/useTranslation"
import { InteractWithQuestion, MODE } from "./InteractWithQuestion"
import { Markdown } from "./Markdown"
import { Result } from "./QuestionComponent"
import { BaseItem, SortableList } from "./SortableList"
import { Checkbox } from "./ui/checkbox"
import { Label } from "./ui/label"

/**
 * ExerciseMultipleChoice is a multiple choice exercise.
 *
 * @param props
 * @param props.question The question.
 * @param props.permalink Permalink to the question (optional)
 * @param props.onResult Function to call after (optional)
 * @param props.regenerate Function to regenerate the question (optional)
 * @param props.viewOnly Whether the exercise is in view-only mode (optional)
 */
export function ExerciseMultipleChoice({
  question,
  permalink,
  onResult,
  regenerate,
}: {
  question: MultipleChoiceQuestion
  permalink?: string
  onResult?: (result: Result) => void
  regenerate?: () => void
}) {
  const { playSound } = useSound()
  const { t } = useTranslation()

  const [state, setState] = useState<{
    /** The current state of the exercise interaction */
    mode: MODE

    /** The indices of the selected answers */
    choice: Array<number>

    /**
     * The feedback object returned by question.feedback(). Will be set when the
     * Promise returned by question.feedback() resolves.
     */
    feedbackObject?: MultipleChoiceFeedback
  }>({
    mode: question.sorting ? "draft" : "invalid",
    choice: question.sorting ? [...Array(question.answers.length).keys()] : [],
  })

  const { mode, choice, feedbackObject } = state

  /**
   * SetChoice sets the entire choice array.
   *
   * @param newChoice The new choice array
   */
  function setChoice(newChoice: Array<number>): void {
    setState({
      ...state,
      choice: newChoice,
    })
  }

  /**
   * SetChoiceEntry sets the choice for a single entry.
   *
   * @param key The index of the entry
   * @param value Whether the entry should be chosen
   */
  function setChoiceEntry(key: number, value: boolean): void {
    const newChoice = question.allowMultiple ? choice.filter((x) => x !== key) : []
    if (value) {
      newChoice.push(key)
    }
    setState({
      ...state,
      mode: newChoice.length === 0 ? "invalid" : "draft",
      choice: newChoice.sort(),
    })
  }

  function handleClick() {
    if (mode === "draft") {
      if (question.feedback !== undefined) {
        setState({ ...state, mode: "submitted" })
        void Promise.resolve(question.feedback({ choice })).then((feedbackObject) => {
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
      if (!(e instanceof KeyboardEvent)) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === "Enter") {
        e.preventDefault()
        handleClick()
        return
      }
      if (mode === "correct" || mode === "incorrect") return

      if (!question.sorting) {
        const num = parseInt(e.key)
        if (!Number.isNaN(num) && num >= 1 && num <= question.answers.length) {
          e.preventDefault()
          const id = num - 1 // answers[num - 1].key
          setChoiceEntry(id, !choice.includes(id))
          return
        }
      }
    },
  })

  if (!question.sorting) {
    const message = []
    if (mode === "correct") {
      message.push(<b className="text-2xl">Correct!</b>)
    } else if (mode === "incorrect") {
      message.push(
        feedbackObject?.correctChoice ? (
          <>
            <b className="text-xl">{t("correct.solution")}:</b>
            <br />
            {t("see.above")}
          </>
        ) : (
          t("incorrect")
        ),
      )
      if (feedbackObject?.feedbackText) message.push(<Markdown md={feedbackObject.feedbackText} />)
    }
    const disabled = mode === "correct" || mode === "incorrect"
    return (
      <InteractWithQuestion
        permalink={permalink}
        name={question.name}
        regenerate={regenerate}
        footerMode={mode}
        footerMessage={message}
        handleFooterClick={handleClick}
      >
        <Markdown md={question.text ?? ""} />
        <div className="flex flex-col flex-wrap gap-4 p-4">
          {question.answers.map((answer, index) => {
            const isCorrectAnswer = true === feedbackObject?.correctChoice?.includes(index)
            const id = `${index}`
            return (
              <div key={index} className="flex items-center space-x-2">
                <FeedbackIconAndTooltip
                  isCorrectAnswer={isCorrectAnswer}
                  userGaveCorrectAnswer={isCorrectAnswer === choice.includes(index)}
                  hidden={!disabled}
                  id={id}
                />
                <Checkbox
                  id={id}
                  checked={choice.includes(index)}
                  disabled={disabled}
                  onCheckedChange={() => {
                    setChoiceEntry(index, !choice.includes(index))
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor={id}>
                    <Markdown md={answer} />
                  </Label>
                </div>
              </div>
            )
          })}
        </div>
      </InteractWithQuestion>
    )
  } else {
    const message =
      mode === "correct" ? (
        <b className="text-2xl">{t("feedback.correct")}</b>
      ) : mode === "incorrect" ? (
        <>
          <b className="text-lg">{t("feedback.thats-ok")}</b>
          <br />
          {t("feedback.correct-order")}
        </>
      ) : null
    const items: BaseItem[] = []
    for (const position of choice) {
      items.push({
        position,
        element: <Markdown md={question.answers[position]} />,
      })
    }
    const onChange = (newItems: Array<BaseItem>) => setChoice(newItems.map((item) => item.position))

    return (
      <InteractWithQuestion
        permalink={permalink}
        name={question.name}
        regenerate={regenerate}
        footerMode={mode}
        footerMessage={message}
        handleFooterClick={handleClick}
      >
        <Markdown md={question.text ?? ""} />
        <SortableList items={items} onChange={onChange} className="p-5" disabled={mode !== "draft"} />
      </InteractWithQuestion>
    )
  }
}

function FeedbackIconAndTooltip({
  isCorrectAnswer,
  userGaveCorrectAnswer,
  hidden,
  id = "",
}: {
  isCorrectAnswer: boolean
  userGaveCorrectAnswer: boolean
  hidden: boolean
  id?: string
}) {
  const { t } = useTranslation()
  const correctnessMsg = isCorrectAnswer ? t("answer.correct") : t("answer.wrong")
  const choiceMsg = userGaveCorrectAnswer ? t("choice.correct") : t("choice.wrong")
  return (
    <>
      <a id={`myid-${id}`}>
        <FeedbackIcon correct={isCorrectAnswer} hidden={hidden} />
      </a>
      <Tooltip anchorSelect={`#myid-${id}`} place="left" className="z-10" hidden={hidden}>
        {correctnessMsg}
        <br />
        {choiceMsg}
      </Tooltip>
    </>
  )
}

function FeedbackIcon({ correct, hidden }: { correct: boolean; hidden: boolean }) {
  const cn = hidden ? " invisible" : ""
  if (correct) {
    return <CheckCheck className={"h-4 w-4 text-green-700" + cn} />
  } else {
    return <XCircle className={"h-4 w-4 text-destructive" + cn} />
  }
}
