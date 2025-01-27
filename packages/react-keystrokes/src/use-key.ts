import { useState, useContext, useEffect } from 'react'
import { KeystrokesContext } from './KeystrokesContext'
import type { BrowserKeyEventProps, Handler, KeyEvent } from '@rwh/keystrokes'

export const useKey = (key: string, preventDefault?: boolean) => {
  const [isPressed, setIsPressed] = useState(false)

  const keystrokes = useContext(KeystrokesContext)()

  const updatePressedEffect = () => {
    const handler: Handler<KeyEvent<KeyboardEvent, BrowserKeyEventProps>> = {
      onPressed: (e: KeyEvent<KeyboardEvent, BrowserKeyEventProps>) => {
        setIsPressed(true)
        if (e.preventDefault && preventDefault === true) {
          e.preventDefault()
        }
      },
      onReleased: () => setIsPressed(false),
    }

    keystrokes.bindKey(key, handler)
    return () => {
      keystrokes.unbindKey(key, handler)
    }
  }
  useEffect(updatePressedEffect, [keystrokes])

  return isPressed
}
