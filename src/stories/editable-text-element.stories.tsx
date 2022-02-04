import { ComponentMeta } from '@storybook/react'
import { ComponentHeader, stringify } from './utils'
import React from 'react'

class EditableTextElement extends React.Component<
  { reportState: React.Dispatch<{ text: string }> },
  { text: string }
> {
  private divRef
  private reportState

  constructor(props: { reportState: React.Dispatch<{ text: string }> }) {
    super(props)

    this.state = { text: 'Hello World' }
    this.divRef = React.createRef<HTMLDivElement>()
    this.reportState = props.reportState
  }

  componentDidMount() {
    this.divRef.current?.addEventListener('beforeinput', (event) => {
      const ranges = event.getTargetRanges()

      if (event.inputType === 'insertText') {
        const pos = ranges[0].startOffset

        this.changeText(
          (text) => text.slice(0, pos) + event.data + text.slice(pos)
        )
      } else if (
        event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward'
      ) {
        const from = ranges[0].startOffset
        const to = ranges[0].endOffset

        this.changeText((text) => text.slice(0, from) + text.slice(to))
      } else {
        event.preventDefault()
      }
    })
    this.reportState(this.state)
  }

  render() {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        className="dbdocs sbdocs-p"
        style={{
          padding: '1em',
          border: '1px solid black',
          marginBottom: '1em',
        }}
        ref={this.divRef}
      >
        {this.state.text}
      </div>
    )
  }

  shouldComponentUpdate(): boolean {
    if (this.divRef.current == null) return true

    return false
  }

  changeText(func: (text: string) => string) {
    this.setState(
      ({ text }) => {
        return {
          text: func(text),
        }
      },
      () => this.reportState(this.state)
    )
  }
}

function ReportComponentState({
  children,
}: {
  children: (setState: React.Dispatch<unknown>) => JSX.Element
}) {
  const [state, setState] = React.useState<unknown>()

  return (
    <>
      <ComponentHeader>Element:</ComponentHeader>
      {children(setState)}
      <ComponentHeader>State:</ComponentHeader>
      <pre>{stringify(state)}</pre>
    </>
  )
}

export default {
  title: 'Editable text element',
  component: EditableTextElement,
} as ComponentMeta<typeof EditableTextElement>

export const Basic = () => (
  <ReportComponentState>
    {(reportState) => <EditableTextElement reportState={reportState} />}
  </ReportComponentState>
)
