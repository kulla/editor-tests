import * as React from 'react'
import stringify from 'json-stringify-pretty-compact'

const originalContent: Content = [
  { type: 'text', text: 'jlkjfdskl ds jlkjdsf lkjdlkf jdlksjf dslkj' },
]

export function BoldAndItalic() {
  const [content, setContent] = React.useState<Content>(originalContent)
  const [startCursor, setStartCursor] = React.useState<Cursor | null>(null)
  const [endCursor, setEndCursor] = React.useState<Cursor | null>(null)

  React.useEffect(() => {
    document.addEventListener('selectionchange', () => {
      const selection = document.getSelection()

      if (selection == null) return

      const anchorNode = selection.anchorNode
      const focusNode = selection.focusNode

      // TODO: When does this occur?!
      if (anchorNode == null || focusNode == null) return

      const anchor: HTMLPosition = {
        node: anchorNode,
        offset: selection.anchorOffset,
      }
      const focus: HTMLPosition = {
        node: focusNode,
        offset: selection.focusOffset,
      }

      const isSelectionForward =
        selection.isCollapsed || isBefore(anchor, focus)

      setStartCursor(getCursor(isSelectionForward ? anchor : focus))
      setEndCursor(getCursor(isSelectionForward ? focus : anchor))
    })
  }, [])

  return (
    <>
      <p>{render(content)}</p>
      <hr />
      <h1>State</h1>
      <h2>Content</h2>
      <pre>{stringify(content)}</pre>
      <h2>Start Cursor</h2>
      <pre>{stringify(startCursor)}</pre>
      <h2>End Cursor</h2>
      <pre>{stringify(endCursor)}</pre>
    </>
  )
}

function render(
  content: Content | InlineElement,
  path: Path = []
): React.ReactNode {
  if (Array.isArray(content)) {
    return (
      <span data-path={JSON.stringify(path)}>
        {content.map((element, i) => render(element, [...path, i]))}
      </span>
    )
  } else if (content.type === 'bold') {
    return (
      <b data-path={JSON.stringify(path)}>
        {render(content.content, [...path, 'content'])}
      </b>
    )
  } else if (content.type === 'italic') {
    return (
      <i data-path={JSON.stringify(path)}>
        {render(content.content, [...path, 'content'])}
      </i>
    )
  } else {
    return (
      <span data-path={JSON.stringify(path)} data-type="text">
        {content.text}
      </span>
    )
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

interface Cursor {
  after: Path
  before: Path
}
type Path = Array<string | number>

function getCursor(position: HTMLPosition): Cursor | null {
  const before = getPath(
    (node) => node.nextSibling ?? node.parentElement,
    position
  )
  const after = getPath(
    (node) => node.previousSibling ?? node.parentElement,
    position
  )

  return before != null && after != null ? { after, before } : null
}

function getPath(
  getNextNode: (node: Node) => Node | null,
  { node, offset }: HTMLPosition
): Path | null {
  if (isElement(node)) {
    const dataPath = node.attributes.getNamedItem('data-path')?.value

    if (dataPath != null) {
      try {
        // For a proof of concept it is okay to have no typechecking here
        const path = JSON.parse(dataPath) as Path

        return node.attributes.getNamedItem('data-type')?.value === 'text'
          ? [...path, offset]
          : path
      } catch (e) {
        // ignore
      }
    }
  }

  const nextNode = getNextNode(node)

  if (nextNode != null) {
    return getPath(getNextNode, { node: nextNode, offset })
  }

  return null
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

// Thanks to https://stackoverflow.com/a/8039026/1165155 (thank you Tim Down)
function isBefore(anchor: HTMLPosition, focus: HTMLPosition) {
  const range = document.createRange()

  range.setStart(anchor.node, anchor.offset)
  range.setEnd(focus.node, focus.offset)

  let result = !range.collapsed

  range.detach()

  return result
}

interface HTMLPosition {
  node: Node
  offset: number
}
