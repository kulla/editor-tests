export function createRenderFunction({ editMode }: { editMode: boolean }) {
  function render(content: Content): JSX.Element {
    const plugin = Registry[content.type]

    return editMode && plugin.renderEditMode != null
      ? plugin.renderEditMode(content, render)
      : plugin.render(content, render)
  }

  return render
}

const Registry: Record<Content['type'], PluginDefinition> = {
  'drag-n-drop': {
    render: (dragNDrop: DragNDrop, renderChildren) => {
      return (
        <div>
          {dragNDrop.exercise.map(renderChildren)}
          <br />
          {shuffle(getSolutions(dragNDrop)).map((a) => (
            <>{renderChildren(a)}&nbsp;</>
          ))}
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
          <ul>
            {dragNDrop.wrongAnswers.map((w) => (
              <li>{renderChildren(w)}</li>
            ))}
          </ul>
        </div>
      )
    },
  },
  paragraph: {
    render: (paragraph: Paragraph, renderChildren) => {
      return <p>{paragraph.content.map(renderChildren)}</p>
    },
  },
  'wrong-answer': {
    render: (wrongAnswer: WrongAnswer, renderChildren) => {
      return (
        <span style={{ background: '#f4cccc' }}>
          {wrongAnswer.content.map(renderChildren)}
        </span>
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
    // TODO: Kontextabhängigkeit -> brauchen bessere Lösung
    renderEditMode: (solution: Solution, renderChildren) => {
      return (
        <span style={{ background: '#d9e9d5' }}>
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

function getSolutions(dragNDrop: DragNDrop): Answer[] {
  const solutions: Answer[] = dragNDrop.exercise
    .flatMap((x) => x.content)
    .filter(isSolution)

  return solutions.concat(dragNDrop.wrongAnswers)
}

function isSolution(content: Content): content is Solution {
  return content.type === 'solution'
}

function shuffle(answers: Answer[]): Answer[] {
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[answers[i], answers[j]] = [answers[j], answers[i]]
  }
  return answers
}

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

type Content =
  | Text
  | Italic
  | Solution
  | WrongAnswer
  | Paragraph
  | DragNDrop
  | Answer
type Answer = WrongAnswer | Solution

export type DragNDrop = {
  type: 'drag-n-drop'
  exercise: Paragraph[]
  wrongAnswers: WrongAnswer[]
}

type Paragraph = {
  type: 'paragraph'
  content: (Italic | Solution | Text)[]
}

type Solution = {
  type: 'solution'
  content: Text[]
}

type WrongAnswer = {
  type: 'wrong-answer'
  content: Text[]
}

type Italic = {
  type: 'italic'
  content: Text[]
}

type Text = {
  type: 'text'
  text: string
}
