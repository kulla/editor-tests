import React from 'react'
import { ComponentMeta } from '@storybook/react'
import { ReportComponentState } from './utils'
import { EditableTextElement } from './editable-text-element'
import { Rendering } from './rendering'
import { EditorWithCursor } from './cursor'
import { BoldAndItalic } from './mark'

export default {
  title: 'Tests',
} as ComponentMeta<typeof EditableTextElement>

export const EditableTextElement_ = () => (
  <Example
    title="EditableTextElement"
    description="The following demonstrates how a contenteditable div can be used to save a string"
  >
    <ReportComponentState>
      {(reportState) => <EditableTextElement reportState={reportState} />}
    </ReportComponentState>
  </Example>
)

export const BoldAndItalic_ = () => <BoldAndItalic />

export const Rendering_ = () => <Rendering />
export const EditorWithCursor_ = () => (
  <EditorWithCursor
    content={{
      type: 'dragNDrop',
      exercise: [
        {
          type: 'paragraph',
          content: [
            { type: 'italic', content: { type: 'text', content: 'Berlin' } },
            { type: 'text', content: ' is the capitol of ' },
            { type: 'solution', content: { type: 'text', content: 'Germany' } },
            { type: 'text', content: '. The capitol of ' },
            { type: 'italic', content: { type: 'text', content: 'France' } },
            { type: 'text', content: ' is ' },
            { type: 'solution', content: { type: 'text', content: 'Paris' } },
            { type: 'text', content: '.' },
          ],
        },
      ],
      wrongAnswers: [
        { type: 'wrongAnswer', content: { type: 'text', content: 'Poland' } },
        { type: 'wrongAnswer', content: { type: 'text', content: 'Krakow' } },
      ],
    }}
  />
)

function Example({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <>
      <h1 className="sbdocs sbdocs-h1">{title}</h1>
      <p className="sbdocs sbdocs-p">{description}</p>
      {children}
    </>
  )
}
