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
        <>
          <p>
            <b>Drag & Drop Exercise:</b>
          </p>
          {exercise.map(renderChildren)}
          <p>
            <b>Wrong solutions which also shall be shown:</b>
          </p>
          <ul>
            {wrongAnswers.map((wrongAnswer) => (
              <li>{renderChildren(wrongAnswer)}</li>
            ))}
          </ul>
        </>
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
        <span style={{ background: 'red' }}>{renderChildren(content)}</span>
      )
    },
  },
  solution: {
    render({ content }, renderChildren) {
      return (
        <span style={{ background: 'green' }}>{renderChildren(content)}</span>
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
