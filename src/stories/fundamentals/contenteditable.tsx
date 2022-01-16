import { useState, ComponentProps } from 'react'
import { stringify } from '../utils'

export function InvestigateInputEvent() {
  const [eventState, setEventState] = useState<InputEvent | null>(null)
  const preText = stringify({
    data: eventState?.data,
    inputType: eventState?.inputType,
  })

  return (
    <>
      <ContentEditableDiv
        onInput={(e) => {
          console.log(e)
          setEventState(e.nativeEvent as InputEvent)
        }}
      ></ContentEditableDiv>
      <pre>lastInputEvent: {preText}</pre>
    </>
  )
}

export function ContentEditableDiv(
  props: {
    children?: string
  } & ComponentProps<'div'>
) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      style={{ border: '1px solid black', padding: '1em' }}
      {...props}
    >
      {props.children ?? 'I am an editable div'}
    </div>
  )
}
