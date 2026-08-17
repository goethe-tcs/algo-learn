// Todo: Remove this file and move types

export type Result = "correct" | "incorrect" | "abort" | "timeout"

/** The current display mode */
export type MODE =
  | "initial" // Initial state, "Check" button is disabled
  | "invalid" // Invalid selection (e.g. nothing selected), "Check" button is disabled
  | "draft" // Valid selection (e.g. at least one answer), but not yet submitted
  | "submitted" // "Check" was clicked, feedback was requested
  | "correct" // According to the feedback, the answer was correct
  | "incorrect" // According to the feedback, the answer was incorrect

/** Possible ways to display feedback on an answer */
export type FeedbackVariation = "below" | "overlay"

/**
 * TextFieldState is the state of a single text input field.
 */
export type TextFieldState = {
  text: string // the current contents of the input field
  type: string // the type of the input field
  prompt: string // the prompt text of the input field
  feedbackVariation: FeedbackVariation // the feedback variation of the input field
  setText?: (text: string) => void // callback when the user changes the value
  placeholder: string // the placeholder text of the input (usually in gray)
  invalid: boolean // the mode of the input field
  disabled?: boolean // the mode of the question
  feedback?: string // immediate feedback on the value of this field
  focus?: boolean // true if this is the first input field in the form
}
