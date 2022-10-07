import * as R from 'ramda'
import * as React from 'react'
import stringify from 'json-stringify-pretty-compact'

interface EditorWithCursorProps {
  content: Content
  startCursor?: Cursor
  endCursor?: Cursor
}

interface Cursor {
  after: Path
  before: Path
}
type Path = Array<string | number>
type Content = DragNDrop | Paragraph | WrongAnswer | Solution | Italic | Text

interface DragNDrop {
  type: 'dragNDrop'
  exercise: Paragraph[]
  wrongAnswers: WrongAnswer[]
}

interface Paragraph {
  type: 'paragraph'
  content: InlineElement[]
}

type InlineElement = Solution | Italic | Text

interface WrongAnswer {
  type: 'wrongAnswer'
  content: Text
}

interface Solution {
  type: 'solution'
  content: Text
}

interface Italic {
  type: 'italic'
  content: Text
}

interface Text {
  type: 'text'
  content: string
}

interface PluginDefinition<S extends Content> {
  render(
    content: S,
    path: Path,
    renderChildren: (child: Content, path: Path) => JSX.Element
  ): JSX.Element
}
type PluginRegistry = {
  [P in Content['type']]: PluginDefinition<Content & { type: P }>
}

const registry: PluginRegistry = {
  dragNDrop: {
    render({ exercise, wrongAnswers }, path, renderChildren) {
      return (
        <div
          style={{ fontFamily: 'Nunito Sans' }}
          data-path={JSON.stringify(path)}
        >
          <p>
            <b>Drag & Drop Exercise:</b>
          </p>
          <div data-path={JSON.stringify(['exercise'])}>
            {exercise.map((child, i) =>
              renderChildren(child, [...path, 'exercise', i])
            )}
          </div>
          <p>
            <b>Wrong solutions which also shall be shown:</b>
          </p>
          <ul data-path={JSON.stringify(['wrongAnswers'])}>
            {wrongAnswers.map((wrongAnswer, i) => (
              <li style={{ marginBottom: '0.3em' }} key={i}>
                {renderChildren(wrongAnswer, [...path, 'wrongAnswers', i])}
              </li>
            ))}
          </ul>
        </div>
      )
    },
  },
  paragraph: {
    render({ content }, path, renderChildren) {
      return (
        <p data-path={JSON.stringify(path)}>
          {content.map((child, i) =>
            renderChildren(child, [...path, 'content', i])
          )}
        </p>
      )
    },
  },
  wrongAnswer: {
    render({ content }, path, renderChildren) {
      return (
        <BorderedSpan background="#EA7F99" data-path={JSON.stringify(path)}>
          {renderChildren(content, [...path, 'content'])}
        </BorderedSpan>
      )
    },
  },
  solution: {
    render({ content }, path, renderChildren) {
      return (
        <BorderedSpan background="#488F65" data-path={JSON.stringify(path)}>
          {renderChildren(content, [...path, 'content'])}
        </BorderedSpan>
      )
    },
  },
  italic: {
    render({ content }, path, renderChildren) {
      return (
        <i data-path={JSON.stringify(path)}>
          {renderChildren(content, [...path, 'content'])}
        </i>
      )
    },
  },
  text: {
    render({ content }, path) {
      return (
        <span data-path={JSON.stringify([...path, 'content'])} data-type="text">
          {content}
        </span>
      )
    },
  },
}

export function EditorWithCursor(props: EditorWithCursorProps) {
  function renderChildren(content: Content, path: Path): JSX.Element {
    const plugin = registry[content.type] as PluginDefinition<Content>

    return plugin.render(content, path, renderChildren)
  }

  const divRef = React.createRef<HTMLDivElement>()
  const [startCursor, setStartCursor] = React.useState<Cursor | null>(null)
  const [endCursor, setEndCursor] = React.useState<Cursor | null>(null)

  React.useEffect(() => {
    divRef.current?.addEventListener('beforeinput', (event) =>
      event.preventDefault()
    )
  }, [divRef])

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
      {/* TODO: Remove border */}
      <div contentEditable suppressContentEditableWarning ref={divRef}>
        {renderChildren(props.content, [])}
      </div>
      <hr />
      <h1>State</h1>
      <h2>Content</h2>
      <pre dangerouslySetInnerHTML={{ __html: stringifyContent() }}></pre>
      <h2>Start cursor</h2>
      <pre>{stringify(startCursor)}</pre>
      <h2>End cursor</h2>
      <pre>{stringify(endCursor)}</pre>
    </>
  )

  // TODO: Refactoring
  function stringifyContent() {
    const startSpan = `<span style="background-color: #4169e1; color: white;">`

    let result = ''
    let currentIndent = 0
    let path: Path = []
    const indent = 2
    if (startCursor && R.equals(path, startCursor.after)) {
      result += startSpan
    }

    function renderValue(value: unknown) {
      const shallBeRenderedCompactly = JSON.stringify(value).length < 100

      if (Array.isArray(value)) {
        result += '['
        currentIndent += indent

        for (const [i, child] of value.entries()) {
          path.push(i)

          if (!shallBeRenderedCompactly) {
            renderNewLine()
          } else {
            result += ' '
          }

          renderValue(child)

          result += ','
          if (startCursor && R.equals(path, startCursor.after)) {
            result += startSpan
          }
          if (endCursor && R.equals(path, endCursor.after)) {
            result += `</span>`
          }
          path.pop()
        }

        currentIndent -= indent

        if (!shallBeRenderedCompactly) {
          renderNewLine()
        } else {
          result += ' '
        }
        result += ']'
      } else if (isObject(value)) {
        result += '{'
        currentIndent += indent

        for (const [key, child] of Object.entries(value)) {
          path.push(key)

          if (!shallBeRenderedCompactly) {
            renderNewLine()
          } else {
            result += ' '
          }
          result += key
          result += ': '

          renderValue(child)

          result += ','
          if (startCursor && R.equals(path, startCursor.after)) {
            result += startSpan
          }
          if (endCursor && R.equals(path, endCursor.after)) {
            result += `</span>`
          }
          path.pop()
        }

        currentIndent -= indent
        if (!shallBeRenderedCompactly) {
          renderNewLine()
        } else {
          result += ' '
        }
        result += '}'
      } else if (typeof value === 'string') {
        let splitIndexStart: number | null = null
        let splitIndexEnd: number | null = null

        if (
          startCursor != null &&
          R.equals(startCursor.after, startCursor.before) &&
          R.startsWith(path, startCursor.after)
        ) {
          const [, tail] = R.splitAt(path.length, startCursor.after)

          if (tail.length === 1 && typeof tail[0] === 'number') {
            splitIndexStart = tail[0]
          }
        }

        if (
          endCursor != null &&
          R.equals(endCursor.after, endCursor.before) &&
          R.startsWith(path, endCursor.after)
        ) {
          const [, tail] = R.splitAt(path.length, endCursor.after)

          if (tail.length === 1 && typeof tail[0] === 'number') {
            splitIndexEnd = tail[0]
          }
        }

        result += '"'
        if (splitIndexStart != null && splitIndexEnd != null) {
          result += value.substring(0, splitIndexStart)
          result += startSpan
          result += value.substring(splitIndexStart, splitIndexEnd)
          result += `</span>`
          result += value.substring(splitIndexEnd)
        } else if (splitIndexStart != null) {
          result += value.substring(0, splitIndexStart)
          result += startSpan
          result += value.substring(splitIndexStart)
        } else if (splitIndexEnd != null) {
          result += value.substring(0, splitIndexEnd)
          result += `</span>`
          result += value.substring(splitIndexEnd)
        } else {
          result += value
        }

        result += '"'
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        result += value.toString()
      } else {
        result += 'null'
      }
    }

    function renderNewLine() {
      result += '\n'
      result += ''.padStart(currentIndent)
    }

    function isObject(value: unknown): value is object {
      return typeof value === 'object' && value !== null
    }

    renderValue(props.content)

    return result
  }
}

function BorderedSpan({
  background,
  children,
  ...args
}: {
  background: string
  children: React.ReactNode
  'data-path': string
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px',
        borderRadius: '5px',
        border: '1px solid grey',
        background,
      }}
      {...args}
    >
      {children}
    </span>
  )
}

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
