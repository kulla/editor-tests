import { useState, ComponentProps } from 'react'
import * as R from 'ramda'
import { stringify } from './utils'

export function InvestigateInputEvent() {
  const [eventState, setEventState] = useState<Event | {}>({})
  const preText = stringify(
    R.pick(['data', 'inputType', 'composed', 'isComposing'], eventState)
  )

  return (
    <>
      <ContentEditableDiv
        onInput={(event) => {
          console.log('== The react event ==')
          console.log(event.nativeEvent)
          console.log('== The native Event ==')
          console.log(event.nativeEvent)

          setEventState(event.nativeEvent)
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
