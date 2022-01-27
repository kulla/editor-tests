import React from 'react'
import ReactDOMServer from 'react-dom/server'
import * as R from 'ramda'

import { stringify } from './utils'

export function ContentEditableDivOnBeforeInput({
  onBeforeInput: eventHandler,
}: {
  onBeforeInput: (event: InputEvent) => void
}) {
  const element = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    console.log(element)
    if (element.current != null) {
      console.log('hello')
      element.current.addEventListener('beforeinput', eventHandler)
    }
  }, [element])

  return <ContentEditableDiv ref={element} />
}

export const ContentEditableDiv = React.forwardRef(
  (
    props: {
      children?: string
    } & React.ComponentProps<'div'>,
    ref?: React.LegacyRef<HTMLDivElement>
  ) => {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        style={{
          border: '1px solid black',
          padding: '1em',
          marginBottom: '1em',
        }}
        ref={ref}
        {...props}
      >
        {props.children ?? 'I am an editable div'}
      </div>
    )
  }
)

export function InvestigateEvent({
  investigatedProperties: properties,
  children,
}: {
  investigatedProperties: string[]
  children: (
    eventHandler: (event: React.SyntheticEvent | Event) => void
  ) => React.ReactNode
}) {
  const [eventState, setEventState] = React.useState({})
  const preText = stringify(R.pick(properties, eventState))

  return (
    <>
      {children((event) => {
        if (isReactEvent(event)) {
          console.log('== The react event ==')
          console.log(event)
        }

        const nativeEvent = isReactEvent(event) ? event.nativeEvent : event

        console.log('== The native Event ==')
        console.log(nativeEvent)

        setEventState(nativeEvent)
      })}
      <pre>lastEvent: {preText}</pre>
    </>
  )
}

export function ShowHTML({ children }: { children: React.ReactElement }) {
  return (
    <>
      <ComponentHeader>Source code:</ComponentHeader>
      <SourceCode>{ReactDOMServer.renderToStaticMarkup(children)}</SourceCode>
      <ComponentHeader>Output:</ComponentHeader>
      {children}
    </>
  )
}

function SourceCode({ children }: { children: React.ReactNode }) {
  return (
    <pre
      style={{
        backgroundColor: '#f4f4f4',
        borderLeft: '6px solid #005282',
        padding: '1em',
      }}
    >
      {children}
    </pre>
  )
}

function ComponentHeader({ children }: { children: string }) {
  return (
    <p className="sbdocs sbdocs-p">
      <strong>{children}</strong>
    </p>
  )
}

function isReactEvent(e: object): e is React.SyntheticEvent {
  return R.has('_reactName', e)
}
