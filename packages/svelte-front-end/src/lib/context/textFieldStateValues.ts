import type { TextFieldState } from "$lib/components/types.ts"
import { createContext } from "svelte"

export type TextFieldStateMap = { [p: string]: TextFieldState }
export type TextFieldStateGetter = () => TextFieldStateMap

export const [getTextFieldStateValues, setTextFieldStateValues] = createContext<TextFieldStateGetter>()
