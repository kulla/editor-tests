import * as R from 'ramda'
import stringify from 'json-stringify-pretty-compact'
import React from 'react'

export default {
  title: 'List storage/Editor With Cursor',
  component: EditorWithCursor,
}

export const EditorWithCursor_ = () => <EditorWithCursor></EditorWithCursor>

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

function EditorWithCursor() {
  const [state] = React.useState(convertToInternalStorage(originalState))
  const [startCursor, setStartCursor] = React.useState<Cursor | null>(null)
  const [endCursor, setEndCursor] = React.useState<Cursor | null>(null)
  const divRef = React.createRef<HTMLDivElement>()

  React.useEffect(() => {
    divRef.current?.addEventListener('beforeinput', (event) =>
      event.preventDefault()
    )
  }, [divRef])

  React.useEffect(() => {
    document.addEventListener('selectionchange', () => {
      const selection = document.getSelection()

      if (selection == null) return

      const anchorNode = selection.anchorNode
      const focusNode = selection.focusNode

      // TODO: When does this occur?!
      if (anchorNode == null || focusNode == null) return

      const anchor = getCursor({
        node: anchorNode,
        offset: selection.anchorOffset,
      })
      const focus = getCursor({
        node: focusNode,
        offset: selection.focusOffset,
      })

      if (anchor == null || focus == null || isLessThanOrEqual(anchor, focus)) {
        setStartCursor(anchor)
        setEndCursor(focus)
      } else {
        setStartCursor(focus)
        setEndCursor(anchor)
      }
    })
  }, [])

  return (
    <>
      <div ref={divRef} contentEditable="true" suppressContentEditableWarning>
        {renderInternalState(state)}
      </div>
      <hr />
      <h1>Start Cursor</h1>
      <pre>{stringify(startCursor)}</pre>
      <h1>End Cursor</h1>
      <pre>{stringify(endCursor)}</pre>
      <h1>Internal Storage format</h1>
      <pre>{stringify(state)}</pre>
    </>
  )
}

function getCursor({ node, offset }: HTMLPosition): Cursor | null {
  if (isElement(node)) {
    const dataPath = node.attributes.getNamedItem('data-pos')?.value

    if (dataPath != null) {
      // Okay, let's have no check for NaN here...
      const position = parseInt(dataPath)

      return node.attributes.getNamedItem('data-kind')?.value === 'leaf'
        ? { position, offset }
        : { position }
    }
  }

  const nextNode = node.previousSibling ?? node.parentElement

  if (nextNode != null) {
    return getCursor({ node: nextNode, offset })
  }

  return null
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

interface Cursor {
  position: number
  offset?: number
}

function isLessThanOrEqual(x: Cursor, y: Cursor) {
  if (x.position < y.position) return true
  if (y.position > x.position) return false
  if (x.offset === undefined) return true
  if (y.offset === undefined) return false

  return x.offset <= y.offset
}

function renderInternalState(state: InternalState) {
  const stack: Array<RenderedCompundElement> = []
  let result: React.ReactNode | null = null

  for (const [pos, element] of state.entries()) {
    const attributes: Attributes = {
      'data-pos': pos.toString(),
      'data-kind': element.type === 'start' ? element.kind : 'leaf',
    }

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
          kind: 'leaf',
          contentType: element.contentType,
          text: element.text,
          attributes,
        })
      )
    } else if (element.type === 'start') {
      if (element.kind === 'list') {
        stack.push({
          kind: 'list',
          id: element.id,
          children: [],
          contentType: element.contentType,
          attributes,
        })
      } else {
        stack.push({
          kind: 'object',
          id: element.id,
          properties: {},
          contentType: element.contentType,
          attributes,
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
  if (element.kind === 'leaf') {
    if (element.contentType === 'text') {
      return <span {...element.attributes}>{element.text}</span>
    } else if (element.contentType === 'wrongAnswer') {
      console.log(element.attributes)

      return (
        <BorderedSpan background="#EA7F99" {...element.attributes}>
          {element.text}
        </BorderedSpan>
      )
    } else {
      return (
        <BorderedSpan background="#488F65" {...element.attributes}>
          {element.text}
        </BorderedSpan>
      )
    }
  } else if (element.kind === 'list') {
    if (element.contentType === 'bold') {
      return <b {...element.attributes}>{renderNodes(element.children)}</b>
    } else if (element.contentType === 'italic') {
      return <i {...element.attributes}>{renderNodes(element.children)}</i>
    } else if (element.contentType === 'paragraph') {
      return <p {...element.attributes}>{renderNodes(element.children)}</p>
    } else if (element.contentType === 'exercise') {
      return <div {...element.attributes}>{renderNodes(element.children)}</div>
    } else if (element.contentType === 'wrongAnswers') {
      return (
        <ul {...element.attributes}>
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
      <div {...element.attributes}>
        <p>
          <b>Drag & Drop exercise:</b>
        </p>
        {element.properties['exercise']}
        <p>
          <b>Wrong solutions:</b>
        </p>
        {element.properties['wrongAnswers']}
      </div>
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
  ...attributes
}: {
  background: string
  children: React.ReactNode
} & Attributes) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px',
        borderRadius: '5px',
        border: '1px solid grey',
        background,
      }}
      {...attributes}
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
  attributes: Attributes
}

interface RenderedObject {
  kind: 'object'
  id: number
  properties: Record<string, React.ReactNode>
  currentProperty?: string
  contentType: ObjectContent['type']
  attributes: Attributes
}

interface RenderedLeaf {
  kind: 'leaf'
  text: string
  contentType: LeafContent['type']
  attributes: Attributes
}

interface Attributes {
  'data-pos': string
  'data-kind': RenderedElement['kind']
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

interface HTMLPosition {
  node: Node
  offset: number
}
