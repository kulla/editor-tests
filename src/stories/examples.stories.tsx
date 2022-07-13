import React from 'react'
import { ComponentMeta } from '@storybook/react'
import { ReportComponentState } from './utils'
import { EditableTextElement } from './editable-text-element'
import { Rendering } from './rendering'

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

export const Rendering_ = () => <Rendering />

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
