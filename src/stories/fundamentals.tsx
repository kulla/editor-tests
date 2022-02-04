import React from 'react'

export function ContentEditableDivFixed({
  onBeforeInput: eventHandler,
}: {
  onBeforeInput: (event: InputEvent) => void
}) {
  const element = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (element.current != null) {
      element.current.addEventListener('beforeinput', (event) => {
        // TODO: Better implementation
        // @ts-ignore
        event['targetRanges'] = event.getTargetRanges().map((range) => {
          return {
            collaped: range.collapsed,
            endOffset: range.endOffset,
            startOffset: range.startOffset,
          }
        })
        eventHandler(event)
      })
    }
  }, [element, eventHandler])

  return <ContentEditableDiv ref={element} />
}

export const ContentEditableDiv = React.forwardRef(
  (
    props: React.ComponentProps<'div'>,
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
        I am an editable div
      </div>
    )
  }
)
