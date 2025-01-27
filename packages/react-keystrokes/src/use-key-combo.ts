import { useState, useContext, useEffect } from 'react'
import { KeystrokesContext } from './KeystrokesContext'
import {
  BrowserKeyComboEventProps,
  BrowserKeyEventProps,
  Handler,
  KeyComboEvent,
} from '@rwh/keystrokes'

export const useKeyCombo = (keyCombo: string, preventDefault?: boolean) => {
  const [isPressed, setIsPressed] = useState(false)

  const keystrokes = useContext(KeystrokesContext)()

  const updatePressedEffect = () => {
    const handler: Handler<
      KeyComboEvent<
        KeyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >
    > = {
      onPressed: (e) => {
        setIsPressed(true)
        if (e.finalKeyEvent?.preventDefault && preventDefault === true) {
          e.finalKeyEvent.preventDefault()
        }
      },
      onReleased: () => setIsPressed(false),
    }
    keystrokes.bindKeyCombo(keyCombo, handler)
    return () => {
      keystrokes.unbindKeyCombo(keyCombo, handler)
    }
  }
  useEffect(updatePressedEffect, [keystrokes])

  return isPressed
}
