import { describe, it, expect, vi } from 'vitest'
import {
  browserOnActiveBinder,
  browserOnInactiveBinder,
  browserOnKeyPressedBinder,
  browserOnKeyReleasedBinder,
} from '../browser-bindings'

describe('browserOnActiveBinder(handler) -> void', () => {
  it('correctly binds the given handler to window focus', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.stubGlobal('addEventListener', addEventListenerStub)

    browserOnActiveBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    handler()

    expect(addEventListenerStub).nthCalledWith(1, 'focus', expect.any(Function))
    expect(handlerStub).nthCalledWith(1)

    vi.unstubAllGlobals()
  })
})

describe('browserOnInactiveBinder(handler) -> void', () => {
  it('correctly binds the given handler to window blur', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.stubGlobal('addEventListener', addEventListenerStub)

    browserOnInactiveBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    handler()

    expect(addEventListenerStub).nthCalledWith(1, 'blur', expect.any(Function))
    expect(handlerStub).nthCalledWith(1)

    vi.unstubAllGlobals()
  })

  it('will create synthetic keyup events for all pressed keys', () => {
    const winAddEventListenerStub = vi.fn()
    const docAddEventListenerStub = vi.fn()
    const inactiveHandlerStub = vi.fn()
    const keyPressHandlerStub = vi.fn()
    const dispatchEventStub = vi.fn()
    vi.stubGlobal('addEventListener', winAddEventListenerStub)
    vi.spyOn(document, 'addEventListener').mockImplementation(
      docAddEventListenerStub,
    )
    vi.spyOn(document, 'dispatchEvent').mockImplementation(dispatchEventStub)

    browserOnInactiveBinder(inactiveHandlerStub)
    browserOnKeyPressedBinder(keyPressHandlerStub)

    const inactiveHandler = winAddEventListenerStub.mock.calls[0][1]
    const keyPressHandler = docAddEventListenerStub.mock.calls[0][1]

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      bubbles: true,
      cancelable: true,
    })
    keyPressHandler(keydownEvent)
    inactiveHandler()

    expect(winAddEventListenerStub).nthCalledWith(
      1,
      'blur',
      expect.any(Function),
    )
    expect(docAddEventListenerStub).nthCalledWith(
      1,
      'keydown',
      expect.any(Function),
    )
    expect(keyPressHandlerStub).nthCalledWith(
      1,
      expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'a',
        originalEvent: keydownEvent,
      }),
    )
    expect(dispatchEventStub).nthCalledWith(1, expect.any(KeyboardEvent))

    const syntheticKeyboardEvent = dispatchEventStub.mock.calls[0][0]
    expect(syntheticKeyboardEvent.type).toBe('keyup')
    expect(syntheticKeyboardEvent.key).toBe('a')

    vi.unstubAllGlobals()
  })
})

describe('/stale key state/', () => {
  const getHandlers = () => {
    const winAddEventListenerStub = vi.fn()
    const docAddEventListenerStub = vi.fn()
    const dispatchEventStub = vi.fn()
    vi.stubGlobal('addEventListener', winAddEventListenerStub)
    vi.spyOn(document, 'addEventListener').mockImplementation(
      docAddEventListenerStub,
    )
    vi.spyOn(document, 'dispatchEvent').mockImplementation(dispatchEventStub)

    browserOnInactiveBinder(vi.fn())
    browserOnKeyPressedBinder(vi.fn())
    browserOnKeyReleasedBinder(vi.fn())

    return {
      dispatchEventStub,
      inactive: winAddEventListenerStub.mock.calls[0][1],
      keyPressed: docAddEventListenerStub.mock.calls[0][1],
      keyReleased: docAddEventListenerStub.mock.calls[1][1],
      listenedWindowEvents: winAddEventListenerStub.mock.calls.map((c) => c[0]),
    }
  }

  it('tracks pressed keys by code, so a changed key label cannot strand one', () => {
    const { inactive, keyPressed, keyReleased, dispatchEventStub } =
      getHandlers()

    // keydown reports "?" but the keyup reports "/" — same physical key.
    keyPressed(new KeyboardEvent('keydown', { key: '?', code: 'Slash' }))
    keyReleased(new KeyboardEvent('keyup', { key: '/', code: 'Slash' }))
    inactive()

    // Nothing is held, so losing focus must not replay a synthetic keyup.
    expect(dispatchEventStub).toBeCalledTimes(0)

    vi.unstubAllGlobals()
  })

  it('replays the key reported at keydown when releasing on focus loss', () => {
    const { inactive, keyPressed, dispatchEventStub } = getHandlers()

    keyPressed(new KeyboardEvent('keydown', { key: '?', code: 'Slash' }))
    inactive()

    expect(dispatchEventStub).toBeCalledTimes(1)
    const synthetic = dispatchEventStub.mock.calls[0][0]
    expect(synthetic.type).toBe('keyup')
    expect(synthetic.key).toBe('?')
    expect(synthetic.code).toBe('Slash')

    vi.unstubAllGlobals()
  })

  it('also releases held keys when the page is hidden or unloaded', () => {
    const { listenedWindowEvents } = getHandlers()

    expect(listenedWindowEvents).toContain('blur')
    expect(listenedWindowEvents).toContain('pagehide')
    // visibilitychange is fired at the document but bubbles, so a window
    // listener sees it without disturbing the document listener order.
    expect(listenedWindowEvents).toContain('visibilitychange')

    vi.unstubAllGlobals()
  })

  it('ignores keydowns that cannot have a matching keyup', () => {
    const handlerStub = vi.fn()
    const docAddEventListenerStub = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation(
      docAddEventListenerStub,
    )

    browserOnKeyPressedBinder(handlerStub)
    const keyPressed = docAddEventListenerStub.mock.calls[0][1]

    // IME composition and autofill emit keydowns with no reliable keyup, so
    // tracking them can only ever strand a key.
    keyPressed({ key: 'a', code: 'KeyA', isComposing: true })
    keyPressed({ key: 'Process', code: 'KeyA' })
    keyPressed({ key: 'Unidentified', code: 'KeyA' })

    expect(handlerStub).toBeCalledTimes(0)

    vi.unstubAllGlobals()
  })
})

describe('browserOnKeyPressedBinder(handler) -> void', () => {
  it('correctly binds the given handler to document keydown', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation(
      addEventListenerStub,
    )

    browserOnKeyPressedBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      bubbles: true,
      cancelable: true,
    })
    handler(keydownEvent)

    expect(addEventListenerStub).nthCalledWith(
      1,
      'keydown',
      expect.any(Function),
    )
    expect(handlerStub).nthCalledWith(
      1,
      expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'a',
        originalEvent: keydownEvent,
      }),
    )

    vi.unstubAllGlobals()
  })

  it('correctly binds the given handler to document keydown with a code', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation(
      addEventListenerStub,
    )

    browserOnKeyPressedBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      bubbles: true,
      cancelable: true,
    })
    handler(keydownEvent)

    expect(handlerStub).nthCalledWith(
      1,
      expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'a',
        aliases: ['@KeyA'],
        originalEvent: keydownEvent,
      }),
    )

    vi.unstubAllGlobals()
  })

  describe('/macOS Specific Behavior/', () => {
    it('will release all keys pressed once meta is released', () => {
      const addEventListenerStub = vi.fn()
      const keyPressedHandlerStub = vi.fn()
      const keyReleaseHandlerStub = vi.fn()
      const dispatchEventStub = vi.fn()
      vi.spyOn(document, 'addEventListener').mockImplementation(
        addEventListenerStub,
      )
      vi.spyOn(document, 'dispatchEvent').mockImplementation(dispatchEventStub)
      vi.stubGlobal('navigator', { userAgent: 'mac' })

      browserOnKeyPressedBinder(keyPressedHandlerStub)
      browserOnKeyReleasedBinder(keyReleaseHandlerStub)

      const keyPressedHandler = addEventListenerStub.mock.calls[0][1]
      const keyReleasedHandler = addEventListenerStub.mock.calls[1][1]

      const metaKeydownEvent = new KeyboardEvent('keydown', {
        key: 'Meta',
        code: 'MetaRight',
        bubbles: true,
        cancelable: true,
      })
      const aKeydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        bubbles: true,
        cancelable: true,
      })
      const aKeyupEvent = new KeyboardEvent('keydown', {
        key: 'Meta',
        code: 'MetaRight',
        bubbles: true,
        cancelable: true,
      })

      keyPressedHandler(metaKeydownEvent)
      keyPressedHandler(aKeydownEvent)
      keyReleasedHandler(aKeyupEvent)

      expect(addEventListenerStub).nthCalledWith(
        1,
        'keydown',
        expect.any(Function),
      )
      expect(addEventListenerStub).nthCalledWith(
        2,
        'keyup',
        expect.any(Function),
      )
      expect(keyPressedHandlerStub).nthCalledWith(
        1,
        expect.objectContaining({
          composedPath: expect.any(Function),
          key: 'Meta',
          originalEvent: metaKeydownEvent,
        }),
      )
      expect(keyPressedHandlerStub).nthCalledWith(
        2,
        expect.objectContaining({
          composedPath: expect.any(Function),
          key: 'a',
          originalEvent: aKeydownEvent,
        }),
      )
      expect(keyReleaseHandlerStub).nthCalledWith(
        1,
        expect.objectContaining({
          composedPath: expect.any(Function),
          key: 'Meta',
          originalEvent: aKeyupEvent,
        }),
      )
      expect(dispatchEventStub).nthCalledWith(1, expect.any(KeyboardEvent))

      const syntheticKeyboardEvent = dispatchEventStub.mock.calls[0][0]
      expect(syntheticKeyboardEvent.type).toBe('keyup')
      expect(syntheticKeyboardEvent.key).toBe('a')

      vi.unstubAllGlobals()
    })
  })
})

describe('browserOnKeyReleased(handler) -> void', () => {
  it('correctly binds the given handler to document keyup', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation(
      addEventListenerStub,
    )

    browserOnKeyReleasedBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    const keyupEvent = new KeyboardEvent('keyup', {
      key: 'a',
      code: 'KeyA',
      bubbles: true,
      cancelable: true,
    })
    handler(keyupEvent)

    expect(addEventListenerStub).nthCalledWith(1, 'keyup', expect.any(Function))
    expect(handlerStub).nthCalledWith(
      1,
      expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'a',
        originalEvent: keyupEvent,
      }),
    )

    vi.unstubAllGlobals()
  })
})
