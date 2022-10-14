import * as R from 'ramda'
import * as React from 'react'
import stringify from 'json-stringify-pretty-compact'

const originalContent: Content = [
  { type: 'text', text: 'jlkjfdskl ds jlkjdsf lkjdlkf jdlksjf dslkj' },
]

export function BoldAndItalic() {
  const [content, setContent] = React.useState<Content>(originalContent)
  const [startCursor, setStartCursor] = React.useState<Cursor | null>(null)
  const [endCursor, setEndCursor] = React.useState<Cursor | null>(null)

  React.useEffect(() => {
    document.addEventListener('selectionchange', () => {
      const selection = document.getSelection()

      if (selection == null) return

      const anchorNode = selection.anchorNode
      const focusNode = selection.focusNode

      // TODO: When does this occur?!
      if (anchorNode == null || focusNode == null) return

      const anchor: HTMLPosition = {
        node: anchorNode,
        offset: selection.anchorOffset,
      }
      const focus: HTMLPosition = {
        node: focusNode,
        offset: selection.focusOffset,
      }

      const isSelectionForward =
        selection.isCollapsed || isBefore(anchor, focus)

      setStartCursor(getCursor(isSelectionForward ? anchor : focus))
      setEndCursor(getCursor(isSelectionForward ? focus : anchor))
    })
  }, [])

  return (
    <>
      <div>
        <button onClick={() => wrapSelection('italic')}>
          <i>I</i>
        </button>
        <button onClick={() => wrapSelection('bold')}>
          <b>B</b>
        </button>
      </div>
      <p>{render(content)}</p>
      <hr />
      <h1>State</h1>
      <h2>Content</h2>
      <pre>{stringify(content)}</pre>
      <h2>Start Cursor</h2>
      <pre>{stringify(startCursor)}</pre>
      <h2>End Cursor</h2>
      <pre>{stringify(endCursor)}</pre>
    </>
  )

  function wrapSelection(type: 'italic' | 'bold') {
    if (startCursor == null || endCursor == null) return

    // TODO: Implement wraping for elements where select.after != selection.end
    if (!R.equals(startCursor.after, startCursor.before))
      throw new Error('start cursor is not inside a JSON element')
    if (!R.equals(endCursor.after, endCursor.before))
      throw new Error('end cursor is not inside a JSON element')

    const start = startCursor.after
    const end = endCursor.after

    // Length were path is equal, but final element is an array
    let commonLength = 0

    for (
      let i = 0;
      i < Math.min(startCursor.after.length, endCursor.after.length);
      i++
    ) {
      if (start[i] === end[i]) {
        if (Array.isArray(R.view(R.lensPath(start.slice(0, i)), content))) {
          commonLength = i
        }
      } else {
        break
      }
    }

    console.log('start', start)
    console.log('end', end)
    console.log('commonLength', commonLength)
    console.log('common', start.slice(0, commonLength))

    const startTail = start.slice(commonLength)
    const endTail = end.slice(commonLength)

    const doWrap = (value: unknown) => {
      // value should be an array here
      if (!Array.isArray(value)) throw new Array('value should be an error')
      if (startTail.length === 0 || typeof startTail[0] !== 'number')
        throw new Error(
          'Illegal state: First element of `startTail` should be a number'
        )
      if (endTail.length === 0 || typeof endTail[0] !== 'number')
        throw new Error(
          'Illegal state: First element of `endTail` should be a number'
        )

      let before = value.slice(0, startTail[0])
      let middle = value.slice(startTail[0] + 1, endTail[0])
      let after = value.slice(endTail[0] + 1)

      if (startTail[0] === endTail[0]) {
        const [beforeSplit, middleSplit, afterSplit] = divideAt(
          value[startTail[0]],
          startTail.slice(1),
          endTail.slice(1)
        )

        console.log(beforeSplit)
        console.log(middleSplit)
        console.log(afterSplit)

        before = [...before, beforeSplit]
        middle = [middleSplit]
        after = [afterSplit, ...after]
      }

      return [...before, { type, content: middle }, ...after]
    }

    setContent(
      R.over(R.lensPath(start.slice(0, commonLength)), doWrap, content)
    )
  }
}

// TODO: Better type information
function divideAt(value: unknown, start: Path, end: Path): unknown[] {
  console.log('divideAt', value, start, end)

  if (typeof value === 'string') {
    assert(typeof start[0] === 'number', `start[0] === "number"`)
    assert(typeof end[0] === 'number', `end[0] === "number"`)

    return [
      value.slice(0, start[0]),
      value.slice(start[0], end[0]),
      value.slice(end[0]),
    ]
  }

  if (R.has('type', value)) {
    if (value['type'] === 'text') {
      assert(R.has('text', value))
      assert(start[0] === 'text')
      assert(end[0] === 'text')

      return divideAt(value['text'], start.slice(1), end.slice(1)).map(
        (text) => {
          assert(typeof text === 'string')

          return { type: 'text', text }
        }
      )
    }

    assert(R.has('content', value))
    assert(start[0] === 'content')
    assert(end[0] === 'content')
    return divideAt(value['content'], start.slice(1), end.slice(1)).map(
      (text) => {
        assert(typeof text === 'string')

        return { type: value['type'], text }
      }
    )
  }

  if (Array.isArray(value)) {
    assert(typeof start[0] === 'number')
    assert(typeof end[0] === 'number')
    assert(start[0] !== end[0])

    let before = value.slice(0, start[0])
    let middle = value.slice(start[0] + 1, end[0])
    let after = value.slice(end[0] + 1)

    const [startBefore, startAfter] = split(value[start[0]], start.splice(1))
    const [endBefore, endAfter] = split(value[start[0]], start.splice(1))

    return [
      [...before, startBefore],
      [startAfter, ...middle, endBefore],
      [endAfter, ...after],
    ]
  }

  assert(false)
}

function split(value: unknown, at: Path): unknown[] {
  console.log('split', value, at)

  if (typeof value === 'string') {
    assert(typeof at[0] === 'number')

    return [value.slice(0, at[0]), value.slice(at[0])]
  }

  if (R.has('type', value)) {
    if (value['type'] === 'text') {
      assert(R.has('text', value))
      assert(at[0] === 'text')

      return split(value, at.slice(1)).map((text) => {
        assert(typeof text === 'string')

        return { type: 'text', text }
      })
    }

    assert(R.has('content', value))
    assert(at[0] === 'content')
    return split(value, at.slice(1)).map((text) => {
      assert(typeof text === 'string')

      return { type: value['type'], text }
    })
  }

  if (Array.isArray(value)) {
    assert(typeof at[0] === 'number')

    let before = value.slice(0, at[0])
    let after = value.slice(at[0] + 1)

    const [splitBefore, splitAfter] = split(value[at[0]], at.splice(1))

    return [
      [...before, splitBefore],
      [splitAfter, ...after],
    ]
  }

  assert(false)
}

function assert(value: boolean, message?: string): asserts value {
  if (!value) throw new Error(message ?? 'Illegal state')
}

function render(
  content: Content | InlineElement,
  path: Path = []
): React.ReactNode {
  if (Array.isArray(content)) {
    return (
      <span data-path={JSON.stringify(path)}>
        {content.map((element, i) => (
          <span data-path={JSON.stringify([...path, i])}>
            {render(element, [...path, i])}
          </span>
        ))}
      </span>
    )
  } else if (content.type === 'bold') {
    return (
      <b data-path={JSON.stringify([...path, 'content'])}>
        {render(content.content, [...path, 'content'])}
      </b>
    )
  } else if (content.type === 'italic') {
    return (
      <i data-path={JSON.stringify([...path, 'content'])}>
        {render(content.content, [...path, 'content'])}
      </i>
    )
  } else {
    return (
      <span data-path={JSON.stringify([...path, 'text'])} data-type="text">
        {content.text}
      </span>
    )
  }
}

type Content = InlineElement[]
type InlineElement = Bold | Italic | Text

interface Bold {
  type: 'bold'
  content: InlineElement
}

interface Italic {
  type: 'italic'
  content: InlineElement
}

interface Text {
  type: 'text'
  text: string
}

interface Cursor {
  after: Path
  before: Path
}
type Path = Array<string | number>

function getCursor(position: HTMLPosition): Cursor | null {
  const before = getPath(
    (node) => node.nextSibling ?? node.parentElement,
    position
  )
  const after = getPath(
    (node) => node.previousSibling ?? node.parentElement,
    position
  )

  return before != null && after != null ? { after, before } : null
}

function getPath(
  getNextNode: (node: Node) => Node | null,
  { node, offset }: HTMLPosition
): Path | null {
  if (isElement(node)) {
    const dataPath = node.attributes.getNamedItem('data-path')?.value

    if (dataPath != null) {
      try {
        // For a proof of concept it is okay to have no typechecking here
        const path = JSON.parse(dataPath) as Path

        return node.attributes.getNamedItem('data-type')?.value === 'text'
          ? [...path, offset]
          : path
      } catch (e) {
        // ignore
      }
    }
  }

  const nextNode = getNextNode(node)

  if (nextNode != null) {
    return getPath(getNextNode, { node: nextNode, offset })
  }

  return null
}

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

// Thanks to https://stackoverflow.com/a/8039026/1165155 (thank you Tim Down)
function isBefore(anchor: HTMLPosition, focus: HTMLPosition) {
  const range = document.createRange()

  range.setStart(anchor.node, anchor.offset)
  range.setEnd(focus.node, focus.offset)

  let result = !range.collapsed

  range.detach()

  return result
}

interface HTMLPosition {
  node: Node
  offset: number
}
