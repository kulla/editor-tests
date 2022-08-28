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
    renderChildren: (child: Content) => JSX.Element
  ): JSX.Element
}
type PluginRegistry = {
  [P in Content['type']]: PluginDefinition<Content & { type: P }>
}

const registry: PluginRegistry = {
  dragNDrop: {
    render({ exercise, wrongAnswers }, renderChildren) {
      return (
        <div style={{ fontFamily: 'Nunito Sans' }}>
          <p>
            <b>Drag & Drop Exercise:</b>
          </p>
          {exercise.map(renderChildren)}
          <p>
            <b>Wrong solutions which also shall be shown:</b>
          </p>
          <ul>
            {wrongAnswers.map((wrongAnswer) => (
              <li style={{ marginBottom: '0.3em' }}>
                {renderChildren(wrongAnswer)}
              </li>
            ))}
          </ul>
        </div>
      )
    },
  },
  paragraph: {
    render({ content }, renderChildren) {
      return <p>{content.map(renderChildren)}</p>
    },
  },
  wrongAnswer: {
    render({ content }, renderChildren) {
      return (
        <BorderedSpan background="#EA7F99">
          {renderChildren(content)}
        </BorderedSpan>
      )
    },
  },
  solution: {
    render({ content }, renderChildren) {
      return (
        <BorderedSpan background="#488F65">
          {renderChildren(content)}
        </BorderedSpan>
      )
    },
  },
  italic: {
    render({ content }, renderChildren) {
      return <i>{renderChildren(content)}</i>
    },
  },
  text: {
    render({ content }) {
      return <>{content}</>
    },
  },
}

export function EditorWithCursor(props: EditorWithCursorProps) {
  function renderChildren(content: Content): JSX.Element {
    const plugin = registry[content.type] as PluginDefinition<Content>

    return plugin.render(content, renderChildren)
  }

  return renderChildren(props.content)
}

function BorderedSpan({
  background,
  children,
}: {
  background: string
  children: React.ReactNode
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
    >
      {children}
    </span>
  )
}
