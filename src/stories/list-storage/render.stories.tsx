import * as R from 'ramda'
import stringify from 'json-stringify-pretty-compact'
import React from 'react'

export default {
  title: 'List storage',
  component: EditorWithRendering,
}

export const RenderingExample = () => (
  <EditorWithRendering></EditorWithRendering>
)

// TODO: Better solution for generating IDs
let ID_COUNTER = 0
const originalState: DragNDrop = {
  type: 'dragNDrop',
  exercise: {
    type: 'exercise',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'italic', children: [{ type: 'text', text: 'Berlin' }] },
          { type: 'text', text: ' is the capitol of ' },
          { type: 'solution', text: 'Germany' },
          { type: 'text', text: '. The capitol of ' },
          { type: 'bold', children: [{ type: 'text', text: 'France' }] },
          { type: 'text', text: ' is ' },
          { type: 'solution', text: 'Paris' },
          { type: 'text', text: '.' },
        ],
      },
    ],
  },
  wrongAnswers: {
    type: 'wrongAnswers',
    children: [
      { type: 'wrongAnswer', text: 'Poland' },
      { type: 'wrongAnswer', text: 'Rome' },
    ],
  },
}

function EditorWithRendering() {
  const [state] = React.useState(convertToInternalStorage(originalState))

  return (
    <>
      <h1>Rendering</h1>
      {renderInternalState(state)}
      <h1>Original state</h1>
      <pre>{stringify(originalState)}</pre>
      <h1>Internal Storage format</h1>
      <h2>JSON</h2>
      <pre>{stringify(state)}</pre>
      <h2>Visualisation</h2>
      {renderInternalStateVisualization()}
    </>
  )

  function renderInternalStateVisualization() {
    return <div>{state.map(visualizeInternalStateElement)}</div>
  }

  function visualizeInternalStateElement(
    element: InternalStateElement,
    key: number
  ) {
    if (element.type === 'leaf') {
      return (
        <InternalStateElementBlock color="blue" key={key}>
          {element.contentType}: "{element.text}"
        </InternalStateElementBlock>
      )
    } else if (element.type === 'start') {
      return (
        <InternalStateElementBlock color="green" key={key}>
          Start: {element.contentType} ({element.kind}) of {element.id}
        </InternalStateElementBlock>
      )
    } else if (element.type === 'end') {
      return (
        <InternalStateElementBlock color="orange" key={key}>
          End: {element.id}
        </InternalStateElementBlock>
      )
    }
  }
}

function renderInternalState(state: InternalState) {
  const stack: Array<RenderedCompundElement> = []
  let result: React.ReactNode | null = null

  for (const element of state) {
    if (
      (element.type === 'start' || element.type === 'leaf') &&
      element.property !== undefined
    ) {
      const last = R.last(stack)

      assert(last !== undefined)
      assert(last.kind === 'object')

      last.currentProperty = element.property
    }

    if (element.type === 'leaf') {
      pushNode(
        renderElement({
          kind: 'text',
          contentType: element.contentType,
          text: element.text,
        })
      )
    } else if (element.type === 'start') {
      if (element.kind === 'list') {
        stack.push({
          kind: 'list',
          id: element.id,
          children: [],
          contentType: element.contentType,
        })
      } else {
        stack.push({
          kind: 'object',
          id: element.id,
          properties: {},
          contentType: element.contentType,
        })
      }
    } else if (element.type === 'end') {
      const last = stack.pop()

      assert(last !== undefined)
      assert(last.id === element.id)

      pushNode(renderElement(last))
    }
  }

  assert(result !== null)

  return result

  function pushNode(node: React.ReactNode) {
    const last = R.last(stack)

    if (last !== undefined) {
      if (last.kind === 'list') {
        last.children.push(node)
      } else {
        assert(last.currentProperty !== undefined)

        last.properties[last.currentProperty] = node
      }
    } else {
      result = node
    }
  }
}

function renderElement(element: RenderedElement): React.ReactNode {
  if (element.kind === 'text') {
    if (element.contentType === 'text') {
      return <>{element.text}</>
    } else if (element.contentType === 'wrongAnswer') {
      return <BorderedSpan background="#EA7F99">{element.text}</BorderedSpan>
    } else {
      return <BorderedSpan background="#488F65">{element.text}</BorderedSpan>
    }
  } else if (element.kind === 'list') {
    if (element.contentType === 'bold') {
      return <b>{renderNodes(element.children)}</b>
    } else if (element.contentType === 'italic') {
      return <i>{renderNodes(element.children)}</i>
    } else if (element.contentType === 'paragraph') {
      return <p>{renderNodes(element.children)}</p>
    } else if (element.contentType === 'exercise') {
      return <div>{renderNodes(element.children)}</div>
    } else if (element.contentType === 'wrongAnswers') {
      return (
        <ul>
          {element.children.map((child, i) => (
            <li key={i} style={{ marginBottom: '5px' }}>
              {child}
            </li>
          ))}
        </ul>
      )
    }
  } else {
    return (
      <>
        {element.properties['exercise']}
        {element.properties['wrongAnswers']}
      </>
    )
  }
}

function renderNodes(nodes: React.ReactNode[]) {
  return (
    <>
      {nodes.map((node, i) => (
        <React.Fragment key={i}>{node}</React.Fragment>
      ))}
    </>
  )
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

type RenderedElement = RenderedCompundElement | RenderedLeaf
type RenderedCompundElement = RenderedList | RenderedObject

interface RenderedList {
  kind: 'list'
  id: number
  children: React.ReactNode[]
  contentType: ListContent['type']
}

interface RenderedObject {
  kind: 'object'
  id: number
  properties: Record<string, React.ReactNode>
  currentProperty?: string
  contentType: ObjectContent['type']
}

interface RenderedLeaf {
  kind: 'text'
  text: string
  contentType: LeafContent['type']
}

function assert(predicate: boolean): asserts predicate {
  if (!predicate) {
    throw new Error('Illegal State: ' + predicate.toString())
  }
}

function convertToInternalStorage(content: Content): InternalState {
  return Array.from(getInternalStateElements(content))
}

function* getInternalStateElements(
  content: Content,
  property?: string
): Iterable<InternalStateElement> {
  if (
    content.type === 'wrongAnswer' ||
    content.type === 'solution' ||
    content.type === 'text'
  ) {
    yield {
      type: 'leaf',
      text: content.text,
      contentType: content.type,
      property,
    }
  } else {
    const id = ID_COUNTER++

    if (content.type === 'dragNDrop') {
      yield {
        type: 'start',
        kind: 'object',
        id,
        contentType: content.type,
        property,
      }

      // TODO: Here we know that DragNDrop is the only object type
      for (const key of ['exercise', 'wrongAnswers'] as const) {
        yield* getInternalStateElements(content[key], key)
      }
    } else {
      yield {
        type: 'start',
        kind: 'list',
        id,
        contentType: content.type,
        property,
      }

      for (const child of content.children) {
        yield* getInternalStateElements(child)
      }
    }

    yield { type: 'end', id }
  }
}

function InternalStateElementBlock({
  color,
  children,
  key,
}: {
  key: number
  color: string
  children: React.ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: '10px',
        border: '1px solid black',
        padding: '1em',
        backgroundColor: color,
        marginRight: '0.5em',
        marginBottom: '1em',
      }}
      key={key}
    >
      {children}
    </span>
  )
}

type Content = ObjectContent | ListContent | LeafContent
type ObjectContent = DragNDrop
type LeafContent = WrongAnswer | Solution | Text
type ListContent = Exercise | WrongAnswers | Paragraph | Italic | Bold

interface DragNDrop {
  type: 'dragNDrop'
  exercise: Exercise
  wrongAnswers: WrongAnswers
}

interface Paragraph {
  type: 'paragraph'
  children: (Solution | Italic | Bold | Text)[]
}

interface Exercise {
  type: 'exercise'
  children: Paragraph[]
}

interface WrongAnswers {
  type: 'wrongAnswers'
  children: WrongAnswer[]
}

interface WrongAnswer {
  type: 'wrongAnswer'
  text: string
}

interface Solution {
  type: 'solution'
  text: string
}

interface Italic {
  type: 'italic'
  children: (Bold | Text)[]
}

interface Bold {
  type: 'bold'
  children: (Italic | Text)[]
}

interface Text {
  type: 'text'
  text: string
}

// == Internal storage format ==

type InternalState = Array<InternalStateElement>
type InternalStateElement = Start | End | Leaf

interface Leaf {
  type: 'leaf'
  contentType: 'text' | 'solution' | 'wrongAnswer'
  // Later it can be `number` and `boolean` also
  text: string
  property?: string
}

type Start = StartList | StartObject

interface StartList extends StartBase {
  kind: 'list'
  contentType: ListContent['type']
}

interface StartObject extends StartBase {
  kind: 'object'
  contentType: ObjectContent['type']
}

interface StartBase {
  type: 'start'
  id: number
  property?: string
}

interface End {
  type: 'end'
  id: number
}
