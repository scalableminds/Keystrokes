import { KeyEvent } from './handler-state'
import { KeyComboEvent } from './key-combo-state'
import { OnActiveEventBinder, OnKeyEventBinder } from './keystrokes'

export type BrowserKeyEventProps = {
  composedPath(): EventTarget[]
  preventDefault(): void
}

// These types are not used by the library internally, but are here to
// make it easier for users to work with the browser bindings in typescript
// projects.
export type BrowserKeyEvent = KeyEvent<KeyboardEvent, BrowserKeyEventProps>
export type BrowserKeyComboEvent = KeyComboEvent<
  KeyboardEvent,
  BrowserKeyEventProps,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
>

// eslint-disable-next-line @typescript-eslint/ban-types
export type BrowserKeyComboEventProps = {}

export type MaybeBrowserKeyEventProps<OriginalEvent> =
  OriginalEvent extends KeyboardEvent
    ? BrowserKeyEventProps
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}

export type MaybeBrowserKeyComboEventProps<OriginalEvent> =
  OriginalEvent extends KeyboardEvent
    ? BrowserKeyComboEventProps
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}

// NOTE: These stubs are only used if the library is used in a non-browser
// environment with default binders.
const documentStub = {
  /*
  eslint-disable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
  addEventListener: (..._: any[]): any => {},
  removeEventListener: (..._: any[]): any => {},
  dispatchEvent: (..._: any[]): any => {},
  /*
  eslint-enable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
}

const navigatorStub = {
  userAgent: '',
}

const getDoc = () => (typeof document !== 'undefined' ? document : documentStub)
const getNav = () =>
  typeof navigator !== 'undefined' ? navigator : navigatorStub

// ----------------
// NOTE: Because MacOS does not fire keyup events for the Command key, we need
// to track the state of the Command key ourselves so we can release it
// ourselves.
const isMacOs = () => getNav().userAgent.toLowerCase().includes('mac')
let isMacOsCommandKeyPressed = false

const maybeHandleMacOsCommandKeyPressed = (event: KeyboardEvent) => {
  if (!isMacOs() || event.key !== 'Meta') return
  isMacOsCommandKeyPressed = true
}

const maybeHandleMacOsCommandKeyReleased = (event: KeyboardEvent) => {
  if (!isMacOsCommandKeyPressed || event.key !== 'Meta') return
  isMacOsCommandKeyPressed = false
  dispatchKeyUpForAllActiveKeys()
}
// ----------------

const activeKeyEvents = new Map<string, KeyboardEvent>()

// Keyed by the physical key rather than the reported label as this not stable. See README.
const keyEventIdentity = (event: KeyboardEvent) => event.code || event.key

// Composition keydowns (IME) and the placeholder keys some autofill
// implementations emit never receive a matching keyup, so tracking them could
// only ever strand a key. Note we never filter keyups: those can only ever
// remove state, and dropping one is what strands a key in the first place.
const cannotBeReleased = (event: KeyboardEvent) =>
  event.isComposing === true ||
  event.key === 'Process' ||
  event.key === 'Unidentified'

const addActiveKeyEvent = (event: KeyboardEvent) => {
  activeKeyEvents.set(keyEventIdentity(event), event)
}

const removeActiveKeyEvent = (event: KeyboardEvent) => {
  activeKeyEvents.delete(keyEventIdentity(event))
}

const dispatchKeyUpForAllActiveKeys = () => {
  for (const activeKeyEvent of activeKeyEvents.values()) {
    const event = new KeyboardEvent('keyup', {
      key: activeKeyEvent.key,
      code: activeKeyEvent.code,
      bubbles: true,
      cancelable: true,
    })
    getDoc().dispatchEvent(event)
  }
  activeKeyEvents.clear()
}

export const browserOnActiveBinder: OnActiveEventBinder = (handler) => {
  try {
    const handlerWrapper = () => handler()
    addEventListener('focus', handlerWrapper)
    return () => {
      removeEventListener('focus', handlerWrapper)
    }
  } catch {}
}

export const browserOnInactiveBinder: OnActiveEventBinder = (handler) => {
  try {
    const handlerWrapper = () => {
      dispatchKeyUpForAllActiveKeys()
      handler()
    }

    // blur does not cover every way a page can stop receiving key events, and any
    // keyup delivered elsewhere in the meantime is lost.
    const visibilityHandler = () => {
      const doc = getDoc() as Partial<Document>
      if (doc.visibilityState === 'hidden') handlerWrapper()
    }

    addEventListener('blur', handlerWrapper)
    addEventListener('pagehide', handlerWrapper)
    // visibilitychange is fired at the document, but it bubbles, so listening on
    // the window keeps the document listener order untouched.
    addEventListener('visibilitychange', visibilityHandler)

    return () => {
      removeEventListener('blur', handlerWrapper)
      removeEventListener('pagehide', handlerWrapper)
      removeEventListener('visibilitychange', visibilityHandler)
    }
  } catch {}
}

export const browserOnKeyPressedBinder: OnKeyEventBinder<
  KeyboardEvent,
  BrowserKeyEventProps
> = (handler) => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => {
      if (cannotBeReleased(e)) return

      addActiveKeyEvent(e)
      maybeHandleMacOsCommandKeyPressed(e)

      handler({
        key: e.key,
        aliases: [`@${e.code}`],
        identity: e.code || undefined,
        originalEvent: e,
        composedPath: () => e.composedPath(),
        preventDefault: () => e.preventDefault(),
      })
    }
    getDoc().addEventListener('keydown', handlerWrapper)
    return () => getDoc().removeEventListener('keydown', handlerWrapper)
  } catch {}
}

export const browserOnKeyReleasedBinder: OnKeyEventBinder<
  KeyboardEvent,
  BrowserKeyEventProps
> = (handler) => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => {
      removeActiveKeyEvent(e)
      maybeHandleMacOsCommandKeyReleased(e)

      handler({
        key: e.key,
        aliases: [`@${e.code}`],
        identity: e.code || undefined,
        originalEvent: e,
        composedPath: () => e.composedPath(),
        preventDefault: () => e.preventDefault(),
      })
    }
    getDoc().addEventListener('keyup', handlerWrapper)
    return () => getDoc().removeEventListener('keyup', handlerWrapper)
  } catch {}
}
