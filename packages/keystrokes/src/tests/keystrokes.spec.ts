import { describe, it, expect, vi } from 'vitest'
import { Keystrokes } from '../keystrokes'
import { KeyComboEvent, KeyEvent, createTestKeystrokes } from '..'
import {
  BrowserKeyComboEventProps,
  BrowserKeyEventProps,
} from '../browser-bindings'

describe('new Keystrokes(options)', () => {
  it('will automatically release self-releasing keys', () => {
    const keystrokes = createTestKeystrokes({
      selfReleasingKeys: ['meta', 'z'],
    })

    expect(keystrokes.checkKeyCombo('meta > z')).toBe(false)

    keystrokes.press({ key: 'meta' })

    expect(keystrokes.checkKey('meta')).toBe(true)
    expect(keystrokes.checkKeyCombo('meta > z')).toBe(false)

    keystrokes.press({ key: 'z' })

    expect(keystrokes.checkKey('z')).toBe(true)
    expect(keystrokes.checkKeyCombo('meta > z')).toBe(true)

    keystrokes.release({ key: 'meta' })

    expect(keystrokes.checkKey('z')).toBe(false)
    expect(keystrokes.checkKey('meta')).toBe(false)
    expect(keystrokes.checkKeyCombo('meta > z')).toBe(false)
  })

  describe('#bindEnvironment(options)', () => {
    it('accepts a custom focus, blur, key pressed and key released binder', () => {
      const keystrokes = new Keystrokes()

      type EmptyObject = Record<never, never>

      let press: ((event: KeyEvent<EmptyObject, EmptyObject>) => void) | null =
        null
      let release:
        | ((event: KeyEvent<EmptyObject, EmptyObject>) => void)
        | null = null

      const onActive = vi.fn()
      const onInactive = vi.fn()
      const onKeyPressed = vi.fn((p) => (press = p))
      const onKeyReleased = vi.fn((r) => (release = r))

      const aPressed = vi.fn()
      const aReleased = vi.fn()

      // Replaces the default browser binders
      keystrokes.bindEnvironment({
        onActive,
        onInactive,
        onKeyPressed,
        onKeyReleased,
      })

      expect(onActive).toBeCalledTimes(1)
      expect(onActive).toBeCalledWith(expect.any(Function))

      expect(onInactive).toBeCalledTimes(1)
      expect(onInactive).toBeCalledWith(expect.any(Function))

      expect(onKeyPressed).toBeCalledTimes(1)
      expect(onKeyPressed).toBeCalledWith(expect.any(Function))

      expect(onKeyReleased).toBeCalledTimes(1)
      expect(onKeyReleased).toBeCalledWith(expect.any(Function))

      keystrokes.bindKey('a', { onPressed: aPressed, onReleased: aReleased })

      expect(aPressed).toBeCalledTimes(0)
      expect(aReleased).toBeCalledTimes(0)

      press!({ key: 'a' })

      expect(aPressed).toBeCalledTimes(1)
      expect(aReleased).toBeCalledTimes(0)

      release!({ key: 'a' })

      expect(aPressed).toBeCalledTimes(1)
      expect(aReleased).toBeCalledTimes(1)
    })

    it('can setup key remaps', () => {
      const keystrokes = createTestKeystrokes()

      keystrokes.bindEnvironment({
        keyRemap: {
          a: 'b',
          b: 'c',
        },
      })

      const aPressed = vi.fn()
      const bPressed = vi.fn()
      const cPressed = vi.fn()

      keystrokes.bindKey('a', aPressed)
      keystrokes.bindKey('b', bPressed)
      keystrokes.bindKey('c', cPressed)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'c' })

      expect(aPressed).toBeCalledTimes(0)
      expect(bPressed).toBeCalledTimes(1)
      expect(cPressed).toBeCalledTimes(2)
    })
  })

  describe('#bindKey(keyCombo, handler)', () => {
    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(2)
      expect(handler2).toBeCalledTimes(2)
    })

    it('accepts a key and handler object containing handlers called appropriately while the key is pressed or released', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)
    })

    it('allows binding several keyCombos at the same time', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey(['a', 'b'], handler1)
      keystrokes.bindKey(['a'], handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      expect(handler1).toBeCalledTimes(2)
      expect(handler2).toBeCalledTimes(1)
    })

    it('accepts a key and handler which is executed repeatedly while the key is pressed when using aliases', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('@keya', handler1)
      keystrokes.bindKey('@keya', handler2)

      keystrokes.press({ key: 'a', aliases: ['@keya'] })
      keystrokes.press({ key: 'a', aliases: ['@keya'] })

      expect(handler1).toBeCalledTimes(2)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('#unbindKey(keyCombo, handler?)', () => {
    it('will remove a handler function for a given key, preventing it from being called', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a', handler1)

      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(2)
    })

    it('will remove all handler functions for a given key if no handler is given', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a')

      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(1)
    })

    it('will remove a handler object for a given key, preventing it from being called', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a', handler1)

      keystrokes.press({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
    })

    it('will remove all handler objects for a key if no handler is given', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a')

      keystrokes.press({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(1)
    })

    it('allows unbinding several keyCombos at the same time', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey(['a', 'b'], handler1)
      keystrokes.bindKey(['a'], handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey(['a'], handler1)

      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('#bindKeyCombo(keyCombo, handler)', () => {
    it('accepts a key combo and when that combo is satisfied the given handler is executed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler1)
      keystrokes.bindKeyCombo('a,b>c+d', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)

      expect(handler1.onPressed).toBeCalledWith(
        expect.objectContaining({
          finalKeyEvent: expect.objectContaining({ key: 'c' }),
          keyCombo: 'a,b>c+d',
          keyEvents: expect.arrayContaining([
            expect.objectContaining({ key: 'a' }),
            expect.objectContaining({ key: 'b' }),
            expect.objectContaining({ key: 'c' }),
            expect.objectContaining({ key: 'd' }),
          ]),
        }),
      )
    })

    it('will not trigger a key combo handler if the keys are pressed in the wrong order', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c,d', handler1)
      keystrokes.bindKeyCombo('a,b>c,d', handler2)

      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'd' })
      keystrokes.release({ key: 'd' })

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'b' })

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(0)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(0)
      expect(handler1.onReleased).toBeCalledTimes(0)
      expect(handler2.onPressed).toBeCalledTimes(0)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(0)
      expect(handler2.onReleased).toBeCalledTimes(0)
    })

    it('provides all key events invoked while the combo was being satisfied', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      const event = handler.onPressed.mock.calls[0][0] as KeyComboEvent<
        KeyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      expect(event.keyEvents).toBeTruthy()
      expect(event.keyEvents.length).toBe(4)
      expect(event.keyEvents.some((e) => e.key === 'a')).toBe(true)
      expect(event.keyEvents.some((e) => e.key === 'b')).toBe(true)
      expect(event.keyEvents.some((e) => e.key === 'c')).toBe(true)
      expect(event.keyEvents.some((e) => e.key === 'd')).toBe(true)
    })

    it('provides the final key event that invoked in order to satisfy the combo', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      const event = handler.onPressed.mock.calls[0][0] as KeyComboEvent<
        KeyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      expect(event.finalKeyEvent).toBeTruthy()
      expect(event.finalKeyEvent.key).toBe('c')
    })

    it('correctly handles combos with the shift key', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('shift>s', handler)

      keystrokes.press({ key: 'shift' })
      keystrokes.press({ key: 'S' })

      expect(handler.onPressed).toBeCalledTimes(1)

      keystrokes.release({ key: 'S' })

      expect(handler.onReleased).toBeCalledTimes(1)
    })

    it('cancels a combo if an unexpected character is pressed before starting next sequence', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a>b,c>d', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: 'b' })

      keystrokes.press({ key: 'x' })
      keystrokes.release({ key: 'x' })

      keystrokes.press({ key: 'c' })
      keystrokes.press({ key: 'd' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      expect(handler.onPressed).toBeCalledTimes(0)
      expect(handler.onReleased).toBeCalledTimes(0)
    })

    it('will correctly handle escaped characters', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a + \\+', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: '+' })
      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: '+' })

      expect(handler.onPressed).toBeCalledTimes(1)
    })

    it('accepts a key combo made up of aliases and when that combo is satisfied the given handler is executed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('@keya,@keyb>@keyc+@keyd', handler1)
      keystrokes.bindKeyCombo('@keya,@keyb>@keyc+@keyd', handler2)

      keystrokes.press({ key: 'a', aliases: ['@keya'] })
      keystrokes.press({ key: 'a', aliases: ['@keya'] })
      keystrokes.release({ key: 'a', aliases: ['@keya'] })

      keystrokes.press({ key: 'b', aliases: ['@keyb'] })
      keystrokes.press({ key: 'b', aliases: ['@keyb'] })
      keystrokes.press({ key: 'd', aliases: ['@keyd'] })
      keystrokes.press({ key: 'd', aliases: ['@keyd'] })
      keystrokes.press({ key: 'c', aliases: ['@keyc'] })
      keystrokes.press({ key: 'c', aliases: ['@keyc'] })
      keystrokes.release({ key: 'b', aliases: ['@keyb'] })
      keystrokes.release({ key: 'c', aliases: ['@keyc'] })
      keystrokes.release({ key: 'd', aliases: ['@keyd'] })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)

      expect(handler1.onPressed).toBeCalledWith(
        expect.objectContaining({
          finalKeyEvent: expect.objectContaining({ key: 'c' }),
          keyCombo: '@keya,@keyb>@keyc+@keyd',
          keyEvents: expect.arrayContaining([
            expect.objectContaining({ key: 'a' }),
            expect.objectContaining({ key: 'b' }),
            expect.objectContaining({ key: 'c' }),
            expect.objectContaining({ key: 'd' }),
          ]),
        }),
      )
    })
  })

  describe('#unbindKeyCombo(keyCombo, handler?)', () => {
    it('remove a handler for a given key combo', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKeyCombo('a>b', handler1)
      keystrokes.bindKeyCombo('a>b', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'b' })

      keystrokes.unbindKeyCombo('a>b', handler2)

      keystrokes.press({ key: 'b' })

      expect(handler1).toBeCalledTimes(3)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('#checkKey(key)', () => {
    it('will return a boolean indicating if a key is pressed', () => {
      const keystrokes = createTestKeystrokes()

      expect(keystrokes.checkKey('a')).toBe(false)
      expect(keystrokes.checkKey('ArrowRight')).toBe(false)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'ArrowRight' })

      expect(keystrokes.checkKey('a')).toBe(true)
      expect(keystrokes.checkKey('ArrowRight')).toBe(true)

      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: 'ArrowRight' })

      expect(keystrokes.checkKey('a')).toBe(false)
      expect(keystrokes.checkKey('ArrowRight')).toBe(false)
    })

    it('will return a boolean indicating if a key is pressed when using aliases', () => {
      const keystrokes = createTestKeystrokes()

      expect(keystrokes.checkKey('@keya')).toBe(false)

      keystrokes.press({ key: 'a', aliases: ['@keya'] })
      keystrokes.press({ key: 'a', aliases: ['@keya'] })

      expect(keystrokes.checkKey('@keya')).toBe(true)

      keystrokes.release({ key: 'a', aliases: ['@keya'] })

      expect(keystrokes.checkKey('@keya')).toBe(false)
    })
  })

  describe('#checkKeyCombo(keyCombo)', () => {
    it('will return a boolean indicating if a key combo is pressed and a partial key combo state array containing the pressed keys', () => {
      const keystrokes = createTestKeystrokes()

      expect(keystrokes.checkKeyCombo('a>b')).toBe(false)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      expect(keystrokes.checkKeyCombo('a>b')).toBe(true)

      keystrokes.release({ key: 'a' })

      expect(keystrokes.checkKeyCombo('a>b')).toBe(false)
    })
  })

  describe('#checkKeyComboSequenceIndex(keyCombo)', () => {
    it('will return the index of the last active key combo sequence', () => {
      const keystrokes = createTestKeystrokes()

      const keyCombo = 'a>b,c+d,e,f>g'

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(0)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(0)

      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: 'b' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(1)

      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(1)

      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(2)

      keystrokes.press({ key: 'e' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(2)

      keystrokes.release({ key: 'e' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(3)

      keystrokes.press({ key: 'f' })
      keystrokes.press({ key: 'g' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(4)

      keystrokes.release({ key: 'f' })
      keystrokes.release({ key: 'g' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(0)
    })
  })
})

// See the "differences from upstream" section of the readme.
describe('/stale key state/', () => {
  // Builds an event the way the browser bindings do: `identity` is the physical
  // key (event.code) and `key` is the label, which changes with modifier state.
  const ev = (key: string, code: string) =>
    ({ key, aliases: [`@${code}`], identity: code }) as any

  describe('key identity', () => {
    it('leaves no phantom key when keydown and keyup report different keys', () => {
      const keystrokes = createTestKeystrokes()
      const bPressed = vi.fn()
      keystrokes.bindKeyCombo('b', { onPressed: bPressed })

      // Typing "?" and releasing shift before the slash key: the keydown reports
      // "?" while the keyup reports "/".
      keystrokes.press(ev('shift', 'ShiftLeft'))
      keystrokes.press(ev('?', 'Slash'))
      keystrokes.release(ev('shift', 'ShiftLeft'))
      keystrokes.release(ev('/', 'Slash'))

      expect(keystrokes.pressedKeys).toEqual([])

      // A phantom key parked at the head of the active key presses would stop
      // every single key combo from matching, for the rest of the session.
      keystrokes.press(ev('b', 'KeyB'))
      expect(bPressed).toBeCalledTimes(1)
    })

    it('releases a dead key whose keyup reports the composed character', () => {
      const keystrokes = createTestKeystrokes()

      // macOS option+e reports "Dead" on keydown and "e" on keyup.
      keystrokes.press(ev('Dead', 'KeyE'))
      keystrokes.release(ev('e', 'KeyE'))

      expect(keystrokes.pressedKeys).toEqual([])
    })

    it('replaces rather than duplicates state when the key label changes mid press', () => {
      const keystrokes = createTestKeystrokes()

      keystrokes.press(ev('?', 'Slash'))
      keystrokes.press(ev('/', 'Slash'))

      expect(keystrokes.pressedKeys).toEqual(['/'])

      keystrokes.release(ev('/', 'Slash'))

      expect(keystrokes.pressedKeys).toEqual([])
    })

    // https://github.com/RobertWHurst/Keystrokes/issues/64
    it('ignores a keydown carrying no key rather than throwing', () => {
      const keystrokes = createTestKeystrokes()

      expect(() => keystrokes.press({ identity: 'KeyB' } as any)).not.toThrow()
      expect(keystrokes.pressedKeys).toEqual([])
    })

    // The obvious fix for the issue above — bailing out of both handlers — would
    // strand the key here, which is the phantom bug all over again.
    it('still releases a key when the keyup carries no key', () => {
      const keystrokes = createTestKeystrokes()

      keystrokes.press(ev('b', 'KeyB'))
      expect(() =>
        keystrokes.release({ identity: 'KeyB' } as any),
      ).not.toThrow()

      expect(keystrokes.pressedKeys).toEqual([])
    })
  })

  describe('longest combo wins', () => {
    const bindChordAndPlainKey = () => {
      const keystrokes = createTestKeystrokes()
      const chordPressed = vi.fn()
      const chordReleased = vi.fn()
      const plainPressed = vi.fn()
      keystrokes.bindKeyCombo('control + k, b', {
        onPressed: chordPressed,
        onReleased: chordReleased,
      })
      keystrokes.bindKeyCombo('b', { onPressed: plainPressed })
      return { keystrokes, chordPressed, chordReleased, plainPressed }
    }

    const typeChord = (
      keystrokes: ReturnType<typeof bindChordAndPlainKey>['keystrokes'],
    ) => {
      keystrokes.press(ev('control', 'ControlLeft'))
      keystrokes.press(ev('k', 'KeyK'))
      keystrokes.release(ev('k', 'KeyK'))
      keystrokes.release(ev('control', 'ControlLeft'))
      keystrokes.press(ev('b', 'KeyB'))
    }

    it('suppresses the shorter combo while the longer combo is held', () => {
      const { keystrokes, chordPressed, plainPressed } = bindChordAndPlainKey()

      typeChord(keystrokes)

      expect(chordPressed).toBeCalledTimes(1)
      expect(plainPressed).toBeCalledTimes(0)
    })

    it('stops suppressing the shorter combo once the longer combo is released', () => {
      const { keystrokes, chordReleased, plainPressed } = bindChordAndPlainKey()

      typeChord(keystrokes)
      keystrokes.release(ev('b', 'KeyB'))

      expect(chordReleased).toBeCalledTimes(1)
      expect(keystrokes.checkKeyCombo('control + k, b')).toBe(false)

      keystrokes.press(ev('b', 'KeyB'))
      expect(plainPressed).toBeCalledTimes(1)
    })

    it('recovers when the keyup completing the longer combo is never delivered', () => {
      const { keystrokes, chordReleased, plainPressed } = bindChordAndPlainKey()

      typeChord(keystrokes)
      // The keyup for the final `b` is swallowed by the browser. Without a
      // recovery path the chord stays pressed forever and, because it is longer,
      // permanently suppresses every single key combo.
      keystrokes.releaseAllKeys()

      expect(keystrokes.pressedKeys).toEqual([])
      expect(chordReleased).toBeCalledTimes(1)
      expect(keystrokes.checkKeyCombo('control + k, b')).toBe(false)

      keystrokes.press(ev('b', 'KeyB'))
      expect(plainPressed).toBeCalledTimes(1)
    })

    // Documents current behaviour rather than a requirement: matching is
    // positional, so an unrelated held key blocks single key combos. Intended for
    // now — see NOTE[held-key-blocks-single-key-combos] in key-combo-state.ts.
    it('does not fire a single key combo while an unrelated key is held', () => {
      const keystrokes = createTestKeystrokes()
      const bPressed = vi.fn()
      keystrokes.bindKeyCombo('b', { onPressed: bPressed })

      keystrokes.press(ev(' ', 'Space'))
      keystrokes.press(ev('b', 'KeyB'))

      expect(bPressed).toBeCalledTimes(0)
    })
  })

  describe('#releaseAllKeys()', () => {
    it('releases keys that are genuinely held', () => {
      const keystrokes = createTestKeystrokes()
      const released = vi.fn()
      keystrokes.bindKeyCombo('b', { onReleased: released })

      keystrokes.press(ev('b', 'KeyB'))
      keystrokes.releaseAllKeys()

      expect(keystrokes.pressedKeys).toEqual([])
      expect(released).toBeCalledTimes(1)
    })

    it('resets a combo left part way through its sequence', () => {
      const keystrokes = createTestKeystrokes()
      const chordPressed = vi.fn()
      const plainPressed = vi.fn()
      keystrokes.bindKeyCombo('control + k, m', { onPressed: chordPressed })
      keystrokes.bindKeyCombo('m', { onPressed: plainPressed })

      keystrokes.press(ev('control', 'ControlLeft'))
      keystrokes.press(ev('k', 'KeyK'))
      keystrokes.release(ev('k', 'KeyK'))
      keystrokes.release(ev('control', 'ControlLeft'))
      keystrokes.releaseAllKeys()

      keystrokes.press(ev('m', 'KeyM'))

      expect(chordPressed).toBeCalledTimes(0)
      expect(plainPressed).toBeCalledTimes(1)
    })
  })

  describe('partially typed combos', () => {
    const setup = () => {
      const keystrokes = createTestKeystrokes()
      const chordPressed = vi.fn()
      const plainPressed = vi.fn()
      keystrokes.bindKeyCombo('control + k, m', { onPressed: chordPressed })
      keystrokes.bindKeyCombo('m', { onPressed: plainPressed })
      keystrokes.press(ev('control', 'ControlLeft'))
      keystrokes.press(ev('k', 'KeyK'))
      keystrokes.release(ev('k', 'KeyK'))
      keystrokes.release(ev('control', 'ControlLeft'))
      return { keystrokes, chordPressed, plainPressed }
    }

    it('completes the combo within the sequence timeout', () => {
      vi.useFakeTimers()
      try {
        const { keystrokes, chordPressed, plainPressed } = setup()

        keystrokes.press(ev('m', 'KeyM'))

        expect(chordPressed).toBeCalledTimes(1)
        expect(plainPressed).toBeCalledTimes(0)
      } finally {
        vi.useRealTimers()
      }
    })

    it('expires the combo once the sequence timeout has passed', () => {
      vi.useFakeTimers()
      try {
        const { keystrokes, chordPressed, plainPressed } = setup()

        vi.advanceTimersByTime(keystrokes.sequenceTimeout + 1)
        keystrokes.press(ev('m', 'KeyM'))

        // Otherwise a stray control+k swallows whichever single key is pressed
        // next, however many minutes later that happens to be.
        expect(chordPressed).toBeCalledTimes(0)
        expect(plainPressed).toBeCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
