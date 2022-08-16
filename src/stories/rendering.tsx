import { createRenderFunction, DragNDrop } from './example.cloze'

export function Rendering() {
  const exampleDragNDrop: DragNDrop = {
    type: 'drag-n-drop',
    exercise: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'italic',
            content: [{ type: 'text', text: 'Berlin' }],
          },
          { type: 'text', text: ' ist die Hauptstadt von ' },
          {
            type: 'solution',
            content: [{ type: 'text', text: 'Deutschland' }],
          },
          { type: 'text', text: '. Die Hauptstadt von ' },
          {
            type: 'italic',
            content: [{ type: 'text', text: 'Frankreich' }],
          },
          { type: 'text', text: ' ist ' },
          {
            type: 'solution',
            content: [{ type: 'text', text: 'Paris' }],
          },
          { type: 'text', text: '.' },
        ],
      },
    ],
    wrongAnswers: [
      {
        type: 'wrong-answer',
        content: [{ type: 'text', text: 'Polen' }],
      },
      {
        type: 'wrong-answer',
        content: [{ type: 'text', text: 'Krakau' }],
      },
    ],
  }

  return (
    <>
      <h1>Edit Mode</h1>
      {createRenderFunction({ editMode: true })(exampleDragNDrop)}

      <h1>Render Mode</h1>
      {createRenderFunction({ editMode: false })(exampleDragNDrop)}
    </>
  )
}
