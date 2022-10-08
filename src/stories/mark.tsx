import * as React from 'react'
import stringify from 'json-stringify-pretty-compact'

const originalContent: Content = [
  { type: 'text', text: 'jlkjfdskl ds jlkjdsf lkjdlkf jdlksjf dslkj' },
]

export function BoldAndItalic() {
  const [content, setContent] = React.useState<Content>(originalContent)

  return (
    <>
      <p>{render(content)}</p>
      <hr></hr>
      <h1>State</h1>
      <pre>{stringify(content)}</pre>
    </>
  )
}

function render(content: Content | InlineElement): React.ReactNode {
  if (Array.isArray(content)) {
    return <>{content.map(render)}</>
  } else if (content.type === 'bold') {
    return <b>{render(content.content)}</b>
  } else if (content.type === 'italic') {
    return <i>{render(content.content)}</i>
  } else {
    return <>{content.text}</>
  }
}

type Content = InlineElement[]
type InlineElement = Bold | Italic | Text

interface Bold {
  type: 'bold'
  content: InlineElement
}

interface Italic {
  type: 'italic'
  content: InlineElement
}

interface Text {
  type: 'text'
  text: string
}
