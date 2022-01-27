import * as React from 'react'
import * as R from 'ramda'

export function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function isReactEvent(e: object): e is React.SyntheticEvent {
  return R.has('_reactName', e)
}
