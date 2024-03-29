import * as R from 'ramda'
import stringify from 'json-stringify-pretty-compact'
import React from 'react'

export default {
  title: 'List storage/Bold And Italic',
  component: BoldAndItalic,
}

export const BoldAndItalic_ = () => <BoldAndItalic></BoldAndItalic>

// TODO: Better solution for generating IDs
let ID_COUNTER = 0
const originalState: Paragraph = {
  type: 'paragraph',
  children: [
    {
      type: 'text',
      text: 'Eum est eligendi ut id rem. Quisquam fuga architecto et consequuntur expedita consectetur illum et. Non voluptatem autem est amet mollitia quo. Non autem dolore aspernatur placeat ut. Doloribus rerum occaecati dolor. Dolor sint non magnam qui vel. Eum est eligendi ut id rem. Quisquam fuga architecto et consequuntur expedita consectetur illum et. Non voluptatem autem est amet mollitia quo. Non autem dolore aspernatur placeat ut. Doloribus rerum occaecati dolor. Dolor sint non magnam qui vel.Eum est eligendi ut id rem. Quisquam fuga architecto et consequuntur expedita consectetur illum et. Non voluptatem autem est amet mollitia quo. Non autem dolore aspernatur placeat ut. Doloribus rerum occaecati dolor. Dolor sint non magnam qui vel.',
    },
  ],
}

function BoldAndItalic() {
  const [state, setState] = React.useState(
    convertToInternalStorage(originalState)
  )
  const [start, setStart] = React.useState<Cursor | null>(null)
  const [end, setEnd] = React.useState<Cursor | null>(null)
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
        setStart(anchor)
        setEnd(focus)
      } else {
        setStart(focus)
        setEnd(anchor)
      }
    })
  }, [])

  const html = renderUnsafe(state)

  return (
    <>
      <div>
        <button onClick={() => wrapSelection('italic')}>
          <i>I</i>
        </button>
        <button onClick={() => wrapSelection('bold')}>
          <b>B</b>
        </button>
        <button onClick={() => wrapSelection('code')}>
          <code>C</code>
        </button>
        <button
          onClick={() => setState(convertToInternalStorage(originalState))}
        >
          <b>Reset</b>
        </button>
      </div>
      <div
        ref={divRef}
        contentEditable="true"
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
      <hr />
      <h1>HTML</h1>
      <pre>{html}</pre>
      <h1>Start Cursor</h1>
      <pre>{stringify(start)}</pre>
      <h1>End Cursor</h1>
      <pre>{stringify(end)}</pre>
      <h1>Internal Storage format</h1>
      <pre>{stringify(state)}</pre>
    </>
  )

  function wrapSelection(contentType: 'italic' | 'bold' | 'code') {
    if (start == null || end == null) return
    // Let's implement this later
    if (R.equals(start, end)) return

    let before = state.slice(0, start.position)
    let middle = state.slice(start.position, end.position)
    let after = state.slice(end.position)

    if (start.position === end.position) {
      const element = after[0]
      after = R.tail(after)

      assert(start.offset !== undefined)
      assert(end.position !== undefined)
      assert(middle.length === 0)
      assert(element.type === 'leaf')

      const { text } = element

      before = [...before, { ...element, text: text.slice(0, start.offset) }]
      middle = [{ ...element, text: text.slice(start.offset, end.offset) }]
      after = [{ ...element, text: text.slice(end.offset) }, ...after]
    } else {
      if (start.offset !== null) {
        const element = middle[0]
        middle = R.tail(middle)

        assert(element.type === 'leaf')
        const { text } = element

        before = [...before, { ...element, text: text.slice(0, start.offset) }]
        middle = [{ ...element, text: text.slice(start.offset) }, ...middle]
      }

      if (end.offset !== undefined) {
        const element = after[0]
        after = R.tail(after)

        assert(element.type === 'leaf')
        const { text } = element

        middle = [...middle, { ...element, text: text.slice(0, end.offset) }]
        after = [{ ...element, text: text.slice(end.offset) }, ...after]
      }
    }

    const id = nextId()

    setState(
      normalize([
        ...before,
        { type: 'start', kind: 'list', id, contentType },
        ...middle,
        { type: 'end', contentType },
        ...after,
      ])
    )
  }
}

function normalize(state: InternalState): InternalState {
  return state
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

// This is easier to debug :-)
function renderUnsafe(state: InternalState) {
  let result = ''
  let indent = 0

  for (const [pos, element] of state.entries()) {
    if (element.type === 'leaf') {
      newLine()
      result += `<span data-pos="${pos.toString()}" data-kind="leaf">`
      result += element.text
      result += '</span>'
    } else if (element.type === 'start') {
      const htmlTag = toHTMLTag(element.contentType)

      newLine()
      result += `<${htmlTag} id="${element.id.toString()}" data-pos="${pos.toString()}">`

      indent += 2
    } else if (element.type === 'end') {
      indent -= 2
      newLine()
      result += `</${toHTMLTag(element.contentType)}>`
    }
  }

  return result.trim()

  function newLine() {
    result += '\n'
    result += ''.padStart(indent)
  }
}

function toHTMLTag(contentType: ListContent['type']) {
  switch (contentType) {
    case 'code':
      return 'code'
    case 'italic':
      return 'i'
    case 'bold':
      return 'b'
    case 'paragraph':
      return 'p'
  }
}

type RenderedElement = RenderedCompundElement | RenderedLeaf
type RenderedCompundElement = RenderedList

interface RenderedList {
  kind: 'list'
  id: number
  children: React.ReactNode[]
  contentType: ListContent['type']
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
  if (content.type === 'text') {
    yield {
      type: 'leaf',
      text: content.text,
      contentType: content.type,
      property,
    }
  } else {
    const id = nextId()

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

    yield { type: 'end', contentType: content.type }
  }
}

function nextId() {
  return `${ID_COUNTER++}`
}

type Content = LeafContent | ListContent
type LeafContent = Text
type ListContent = Paragraph | Italic | Bold | Code
type Inline = Italic | Bold | Text | Code

interface Paragraph {
  type: 'paragraph'
  children: Inline[]
}

interface Italic {
  type: 'italic'
  children: Inline[]
}

interface Bold {
  type: 'bold'
  children: Inline[]
}

interface Code {
  type: 'code'
  children: Inline[]
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
  contentType: LeafContent['type']
  // Later it can be `number` and `boolean` also
  text: string
  property?: string
}

type Start = StartList

interface StartList {
  kind: 'list'
  contentType: ListContent['type']
  type: 'start'
  id: string
  property?: string
}

interface End {
  type: 'end'
  contentType: ListContent['type']
}

interface HTMLPosition {
  node: Node
  offset: number
}
