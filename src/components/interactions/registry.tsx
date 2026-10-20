import type { ReactNode } from 'react'
import type { Interaction } from '../../schemas/lesson.schema.ts'
import { MultipleChoice } from './MultipleChoice.tsx'
import { NumberLineInput } from './NumberLineInput.tsx'
import { NumericInput } from './NumericInput.tsx'

export type InteractionBindings = {
  interaction: Interaction
  name: string
  value: string | null
  disabled: boolean
  revealed: boolean
  onChange: (value: string | null) => void
}

type InteractionProps<T extends Interaction['type']> = Omit<InteractionBindings, 'interaction'> & {
  interaction: Extract<Interaction, { type: T }>
}

type Registry = {
  [K in Interaction['type']]: (props: InteractionProps<K>) => ReactNode
}

const interactionRegistry: Registry = {
  'multiple-choice': (props) => <MultipleChoice {...props} />,
  'numeric-input': (props) => <NumericInput {...props} />,
  'number-line': (props) => <NumberLineInput {...props} />,
}

export function InteractionHost(props: InteractionBindings) {
  const type = props.interaction.type
  if (type === 'multiple-choice') return interactionRegistry[type]({ ...props, interaction: props.interaction })
  if (type === 'numeric-input') return interactionRegistry[type]({ ...props, interaction: props.interaction })
  if (type === 'number-line') return interactionRegistry[type]({ ...props, interaction: props.interaction })
  const unreachable: never = type
  return unreachable
}
