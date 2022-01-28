import * as React from 'react'
import ReactDOMServer from 'react-dom/server'
import * as R from 'ramda'

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
        if (isSynteticEvent(event)) {
          console.log('== The react event ==')
          console.log(event)
        }

        const nativeEvent = isSynteticEvent(event) ? event.nativeEvent : event

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

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function isSynteticEvent(event: object): event is React.SyntheticEvent {
  return R.has('_reactName', event)
}
