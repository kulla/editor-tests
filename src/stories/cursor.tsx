import * as React from 'react'

interface EditorWithCursorProps {
  content: Content
  startCursor?: Cursor
  endCursor?: Cursor
}

type Cursor = Array<string | number>
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
    cursor: Cursor,
    renderChildren: (child: Content, cursor: Cursor) => JSX.Element
  ): JSX.Element
}
type PluginRegistry = {
  [P in Content['type']]: PluginDefinition<Content & { type: P }>
}

const registry: PluginRegistry = {
  dragNDrop: {
    render({ exercise, wrongAnswers }, cursor, renderChildren) {
      return (
        <div
          style={{ fontFamily: 'Nunito Sans' }}
          data-path={JSON.stringify(cursor)}
        >
          <p>
            <b>Drag & Drop Exercise:</b>
          </p>
          {exercise.map((child, i) =>
            renderChildren(child, [...cursor, 'exercise', i])
          )}
          <p>
            <b>Wrong solutions which also shall be shown:</b>
          </p>
          <ul>
            {wrongAnswers.map((wrongAnswer, i) => (
              <li style={{ marginBottom: '0.3em' }} key={i}>
                {renderChildren(wrongAnswer, [...cursor, 'wrongAnswer', i])}
              </li>
            ))}
          </ul>
        </div>
      )
    },
  },
  paragraph: {
    render({ content }, cursor, renderChildren) {
      return (
        <p data-path={JSON.stringify(cursor)}>
          {content.map((child, i) =>
            renderChildren(child, [...cursor, 'content', i])
          )}
        </p>
      )
    },
  },
  wrongAnswer: {
    render({ content }, cursor, renderChildren) {
      return (
        <BorderedSpan background="#EA7F99" data-path={JSON.stringify(cursor)}>
          {renderChildren(content, [...cursor, 'content'])}
        </BorderedSpan>
      )
    },
  },
  solution: {
    render({ content }, cursor, renderChildren) {
      return (
        <BorderedSpan background="#488F65" data-path={JSON.stringify(cursor)}>
          {renderChildren(content, [...cursor, 'content'])}
        </BorderedSpan>
      )
    },
  },
  italic: {
    render({ content }, cursor, renderChildren) {
      return (
        <i data-path={JSON.stringify(cursor)}>
          {renderChildren(content, [...cursor, 'content'])}
        </i>
      )
    },
  },
  text: {
    render({ content }, cursor) {
      return <span data-path={JSON.stringify(cursor)}>{content}</span>
    },
  },
}

export function EditorWithCursor(props: EditorWithCursorProps) {
  function renderChildren(content: Content, cursor: Cursor): JSX.Element {
    const plugin = registry[content.type] as PluginDefinition<Content>

    return plugin.render(content, cursor, renderChildren)
  }

  const divRef = React.createRef<HTMLDivElement>()

  React.useEffect(() => {
    divRef.current?.addEventListener('beforeinput', (event) =>
      event.preventDefault()
    )
  }, [divRef])

  return (
    // TODO: Remove border
    <div contentEditable suppressContentEditableWarning ref={divRef}>
      {renderChildren(props.content, [])}
    </div>
  )
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
