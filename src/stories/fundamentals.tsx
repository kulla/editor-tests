import { useState, ComponentProps } from 'react'
import * as R from 'ramda'
import { stringify } from './utils'

export function InvestigateInputEvent() {
  return (
    <InvestigateEvent
      investigatedProperties={['data', 'inputType', 'composed', 'isComposing']}
    >
      {(eventHandler) => (
        <ContentEditableDiv onInput={eventHandler}></ContentEditableDiv>
      )}
    </InvestigateEvent>
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
      style={{ border: '1px solid black', padding: '1em', marginBottom: '1em' }}
      {...props}
    >
      {props.children ?? 'I am an editable div'}
    </div>
  )
}

export function InvestigateEvent<E extends React.SyntheticEvent>({
  investigatedProperties: properties,
  children,
}: {
  investigatedProperties: string[]
  children: (eventHandler: React.EventHandler<E>) => React.ReactNode
}) {
  const [eventState, setEventState] = useState<Event | {}>({})
  const preText = stringify(R.pick(properties, eventState))

  return (
    <>
      {children((event: E) => {
        console.log('== The react event ==')
        console.log(event)
        console.log('== The native Event ==')
        console.log(event.nativeEvent)

        setEventState(event.nativeEvent)
      })}
      <pre>lastEvent: {preText}</pre>
    </>
  )
}
