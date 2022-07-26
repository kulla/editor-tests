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

export function editCloze(jsonExample: DragNDrop) {
  let title = jsonExample.type

  // What if wrong answers empty?

  return (
    <div>
      <h1>{title}</h1>
      {jsonExample.exercise.map(editParagraph)}
      <br></br>
      <b>Falsche Lösungen, die zusätzlich angezeigt werden sollen</b>
      <br></br>
      <ul>
        {jsonExample.wrongAnswers.map((wrongAnswer) =>
          editWrongAnswer(wrongAnswer)
        )}
      </ul>
    </div>
  )
}

function editWrongAnswer(wrongAnswer: WrongAnswer) {
  return <li>{wrongAnswer.content.map(editText)}</li>
}

function editParagraph(paragraph: Paragraph) {
  return (
    <>
      {paragraph.content.map((block) => {
        if (block.type === 'text') return editText(block)
        if (block.type === 'italic') {
          return <i>{block.content.map(editText)}</i>
        }
        if (block.type === 'solution') {
          // don't know how to highlight <span>
          return <b>{block.content.map(editText)}</b>
        }
      })}
    </>
  )
}

function editText(text: Text) {
  return <>{text}</>
}
