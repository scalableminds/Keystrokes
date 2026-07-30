export type KeyEvent<OriginalEvent, KeyEventProps> = KeyEventProps & {
  key: string
  aliases?: string[]
  // A stable id for the physical key, used to track which keys are held. `key`
  // cannot serve that purpose because the label a browser reports depends on the
  // modifiers held at the time: shift+slash reports "?" on keydown and, if shift
  // is released first, "/" on keyup. The browser bindings pass event.code here.
  // Falls back to `key` when absent, which keeps non-browser bindings working.
  identity?: string
  originalEvent?: OriginalEvent
}

export type HandlerFn<Event> = (event: Event) => void

export type HandlerObj<Event> = {
  onPressed?: HandlerFn<Event>
  onPressedWithRepeat?: HandlerFn<Event>
  onReleased?: HandlerFn<Event>
}

export type Handler<Event> = HandlerFn<Event> | HandlerObj<Event>

export class HandlerState<Event> {
  _onPressed?: HandlerFn<Event>
  _onPressedWithRepeat?: HandlerFn<Event>
  _onReleased?: HandlerFn<Event>
  _isPressed: boolean
  _identity: Handler<Event>

  constructor(handler: Handler<Event>) {
    this._isPressed = false
    this._identity = handler

    if (typeof handler === 'function') {
      this._onPressedWithRepeat = handler
    } else {
      this._onPressed = handler.onPressed
      this._onPressedWithRepeat = handler.onPressedWithRepeat
      this._onReleased = handler.onReleased
    }
  }

  get isEmpty() {
    return !this._onPressed && !this._onPressedWithRepeat && !this._onReleased
  }

  isOwnHandler(handler: Handler<Event>) {
    return this._identity === handler
  }

  executePressed(event: Event) {
    if (!this._isPressed) this._onPressed?.(event)

    this._isPressed = true
    this._onPressedWithRepeat?.(event)
  }

  executeReleased(event: Event) {
    if (this._isPressed) this._onReleased?.(event)

    this._isPressed = false
  }
}
