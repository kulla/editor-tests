import React from 'react'
import { ComponentHeader } from './utils'

export function Rendering() {
  const [state, setState] = React.useState<unknown>()

  return (
    <>
      <ComponentHeader>State:</ComponentHeader>
      <textarea
        onInput={(event) => {
          console.log(event.target)
        }}
      />
    </>
  )
}
