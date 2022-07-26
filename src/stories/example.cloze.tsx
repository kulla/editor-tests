import { render } from "@testing-library/react"

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
        if (block.type === 'italic') return renderItalic(block)
        if (block.type === 'solution') return editSolution(block)
      })}
    </>
  )
}


function editText(text: Text) {
  return text.text
}

function editSolution(block: Solution) {
    // don't know how to highlight <span>
    return <b>{block.content.map(editText)}</b>
}

function renderCloze(jsonExample: DragNDrop) {
    // TODO: Solutions and answers cannot be concatenated to be shuffled
    const solutions = jsonExample.exercise.map(renderAnswers)[0]
    const answers = solutions.concat(jsonExample.wrongAnswers)

    return (
        <div>
          {jsonExample.exercise.map(renderParagraph)}
          <br></br>
          {answers.map(answer => {
            if (answer.type === "solution") return renderSolution(answer)
            if (answer.type === "wrong-answer") return renderWrongAnswer(answer)
          })}
        </div>
      )
}

function renderAnswers(paragraph: Paragraph) {
    return paragraph.content.map(para => 
        {if (para.type === "solution")
        {
            return paragraph
        }}
        )
}

function renderParagraph(paragraph: Paragraph) {
    return (
        <>
          {paragraph.content.map((block) => {
            if (block.type === 'text') return editText(block)
            if (block.type === 'italic') return renderItalic(block)
            if (block.type === 'solution') return renderSolution(block)
          })}
        </>
      )
} 

function renderItalic(block: Italic) {
    return <i>{block.content.map(editText)}</i>
}

function renderSolution(block: Solution) {
    // don't know how to highlight <span>
    return <b>{block.content.map(item => editText(item).replaceAll("", "_")
              )}   
            </b>
}

function renderWrongAnswer(block: WrongAnswer) {
    return <b>{block.content.map(editText)} </b>
}