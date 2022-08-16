export type DragNDrop = {
  type: 'drag-n-drop'
  exercise: Paragraph[]
  wrongAnswers: WrongAnswer[]
}

export type Paragraph = {
  type: 'paragraph'
  content: (Italic | Solution | Text)[]
}

export type Italic = {
  type: 'italic'
  content: Text[]
}

export type Text = {
  type: 'text'
  text: string
}

export type Solution = {
  type: 'solution'
  content: Text[]
}

export type WrongAnswer = {
  type: 'wrong-answer'
  content: Text[]
}

type Content = Text | Italic | Solution | WrongAnswer | Paragraph | DragNDrop

interface PluginDefinition {
  render(
    content: Content,
    renderChildren: (content: Content) => JSX.Element
  ): JSX.Element
  renderEditMode?(
    content: Content,
    renderChildren: (content: Content) => JSX.Element
  ): JSX.Element
}

const Registry: Record<Content['type'], PluginDefinition> = {
  'drag-n-drop': {
    render: (dragNDrop: DragNDrop, renderChildren) => {
      const wrongAnswers = dragNDrop.wrongAnswers

      const paragraphValues = dragNDrop.exercise
        .map((paragraph) => {
          return paragraph.content
        })
        .flat()
      const correctAnswers = paragraphValues
        .map((value) => {
          if (value.type == 'solution') return value
          else return []
        })
        .flat()

      const allAnswers = [...wrongAnswers, ...correctAnswers]

      return (
        <div>
          {dragNDrop.exercise.map(renderChildren)}
          <br />
          <br />
          {allAnswers.map(renderChildren)}
        </div>
      )
    },
    renderEditMode: (dragNDrop: DragNDrop, renderChildren) => {
      return (
        <div>
          <h2>Drag &amp; Drop Aufgabe:</h2>
          {dragNDrop.exercise.map(renderChildren)}
          <br></br>
          <b>Falsche Lösungen, die zusätzlich angezeigt werden sollen</b>
          <br></br>
          <ul>{dragNDrop.wrongAnswers.map(renderChildren)}</ul>
        </div>
      )
    },
  },
  paragraph: {
    render: (paragraph: Paragraph, renderChildren) => {
      return <>{paragraph.content.map(renderChildren)}</>
    },
  },
  'wrong-answer': {
    render: (wrongAnswer: WrongAnswer, renderChildren) => {
      return (
        <span style={{ background: '#f44336' }}>
          {wrongAnswer.content.map(renderChildren)}{' '}
        </span>
      )
    },
    renderEditMode: (wrongAnswer: WrongAnswer, renderChildren) => {
      return (
        <li>
          <span style={{ background: '#f44336' }}>
            {wrongAnswer.content.map(renderChildren)}
          </span>
        </li>
      )
    },
  },
  solution: {
    render: (solution: Solution, renderChildren) => {
      const underscoredSolutions = solution.content.map((text) => {
        return { type: text.type, text: text.text.replaceAll(/\w/g, '_') }
      })

      return <>{underscoredSolutions.map(renderChildren)}</>
    },
    renderEditMode: (solution: Solution, renderChildren) => {
      return (
        <span style={{ background: '#8fce00' }}>
          {solution.content.map(renderChildren)}
        </span>
      )
    },
  },
  italic: {
    render: (italic: Italic, renderChildren) => {
      return <i>{italic.content.map(renderChildren)}</i>
    },
  },
  text: {
    render: (text: Text) => {
      return <>{text.text}</>
    },
  },
}

export function createRenderFunction({ editMode }: { editMode: boolean }) {
  function render(content: Content): JSX.Element {
    const plugin = Registry[content.type]

    return editMode && plugin.renderEditMode != null
      ? plugin.renderEditMode(content, render)
      : plugin.render(content, render)
  }

  return render
}
