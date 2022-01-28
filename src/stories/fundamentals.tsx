import React from 'react'

export function ContentEditableDivFixed({
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
