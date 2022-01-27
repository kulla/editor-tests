import { useState, ComponentProps } from 'react'
import ReactDOMServer from 'react-dom/server'
import * as R from 'ramda'

import { stringify } from './utils'

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
