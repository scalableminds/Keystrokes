import type { KeyEvent, Handler } from './handler-state'
import { HandlerState } from './handler-state'
import { KeyPress, KeyComboEventMapper } from './keystrokes'

// const sequenceTimeout = 1000 * 2 // 2 seconds

export type KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps> =
  KeyComboEventProps & {
    keyCombo: string
    keyEvents: KeyEvent<OriginalEvent, KeyEventProps>[]
    finalKeyEvent: KeyEvent<OriginalEvent, KeyEventProps>
  }

export class KeyComboState<OriginalEvent, KeyEventProps, KeyComboEventProps> {
  private static _parseCache: Record<string, string[][][]> = {}
  private static _normalizationCache: Record<string, string> = {}

  static parseKeyCombo(keyComboStr: string) {
    if (KeyComboState._parseCache[keyComboStr])
      return KeyComboState._parseCache[keyComboStr]

    const s = keyComboStr.toLowerCase()

    // operator
    let o = ''

    // key
    let key: string[] = []

    // unit
    let unit: string[][] = [key]

    // sequence
    let sequence: string[][][] = [unit]

    // combo
    const rawCombo: string[][][][] = [sequence]

    let isEscaped = false

    for (let i = 0; i < keyComboStr.length; i += 1) {
      // begin escape
      if (s[i] === '\\') {
        isEscaped = true
      }

      // an non-escaped operator
      else if ((s[i] === '+' || s[i] === '>' || s[i] === ',') && !isEscaped) {
        if (o) throw new Error('cannot have two operators in a row')
        o = s[i]
      }

      // any character that is not a space
      else if (s[i].match(/[^\s]/)) {
        // if we had an operator in the last iteration then apply it
        if (o) {
          // start the next sequence
          if (o === ',') {
            key = []
            unit = [key]
            sequence = [unit]
            rawCombo.push(sequence)
          }

          // start the next unit
          else if (o === '>') {
            key = []
            unit = [key]
            sequence.push(unit)
          }

          // start the next key
          else if (o === '+') {
            key = []
            unit.push(key)
          }
          o = ''
        }

        // clear escape
        isEscaped = false

        // add the character to the current key
        key.push(s[i])
      }

      // spaces are ignored
    }

    const combo = rawCombo.map((s) => s.map((u) => u.map((k) => k.join(''))))
    KeyComboState._parseCache[keyComboStr] = combo
    return combo
  }

  static stringifyKeyCombo(keyCombo: string[][][]) {
    return keyCombo
      .map((s) =>
        s
          .map((u) =>
            u
              .map((k) => {
                if (k === '+') return '\\+'
                if (k === '>') return '\\>'
                if (k === ',') return '\\,'
                return k
              })
              .join('+'),
          )
          .join('>'),
      )
      .join(',')
  }

  static normalizeKeyCombo(keyComboStr: string) {
    if (KeyComboState._normalizationCache[keyComboStr]) {
      return KeyComboState._normalizationCache[keyComboStr]
    }
    const normalized = this.stringifyKeyCombo(this.parseKeyCombo(keyComboStr))
    KeyComboState._normalizationCache[keyComboStr] = normalized
    return normalized
  }

  get isPressed() {
    return !!this._isPressedWithFinalUnit
  }

  get sequenceIndex() {
    if (this.isPressed) return this._parsedKeyCombo.length
    return this._sequenceIndex
  }

  get sequenceLength() {
    return this._parsedKeyCombo.length
  }

  private _normalizedKeyCombo: string
  private _parsedKeyCombo: string[][][]
  private _handlerState: HandlerState<
    KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
  >
  private _keyComboEventMapper: KeyComboEventMapper<
    OriginalEvent,
    KeyEventProps,
    KeyComboEventProps
  >
  private _movingToNextSequenceAt: number
  private _sequenceIndex: number
  private _sequenceAdvancedAt: number
  private _unitIndex: number
  private _lastActiveKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][]
  private _lastActiveKeyCount: number
  private _isPressedWithFinalUnit: Set<string> | null

  constructor(
    keyCombo: string,
    keyComboEventMapper: KeyComboEventMapper<
      OriginalEvent,
      KeyEventProps,
      KeyComboEventProps
    >,
    handler: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    > = {},
  ) {
    this._normalizedKeyCombo = KeyComboState.normalizeKeyCombo(keyCombo)
    this._parsedKeyCombo = KeyComboState.parseKeyCombo(keyCombo)
    this._handlerState = new HandlerState(handler)
    this._keyComboEventMapper = keyComboEventMapper
    this._movingToNextSequenceAt = 0
    this._sequenceIndex = 0
    this._sequenceAdvancedAt = 0
    this._unitIndex = 0
    this._lastActiveKeyPresses = []
    this._lastActiveKeyCount = 0
    this._isPressedWithFinalUnit = null
  }

  /**
   * Releases the combo if it is pressed and abandons any progress through its
   * sequence.
   *
   * Both halves matter. A combo waiting part way through its sequence — "control
   * + k" typed but not yet completed — is armed without being pressed, so nothing
   * in the normal release path touches it, and it would otherwise swallow whatever
   * key is pressed next, however much later.
   */
  forceRelease(event?: KeyEvent<OriginalEvent, KeyEventProps>) {
    if (this._isPressedWithFinalUnit) {
      // By this point updateState has already run and cleared _lastActiveKeyPresses,
      // so the release event is built from the event that triggered the recovery.
      if (event) {
        this._handlerState.executeReleased(
          this._wrapEvent(this._lastActiveKeyPresses, {
            key: event.key,
            aliases: new Set(event.aliases),
            identity: event.identity,
            event,
          }),
        )
      }
      this._isPressedWithFinalUnit = null
    }

    this._resetProgress()
  }

  private _resetProgress() {
    this._movingToNextSequenceAt = 0
    this._sequenceIndex = 0
    this._sequenceAdvancedAt = 0
    this._unitIndex = 0
    this._lastActiveKeyPresses.length = 0
  }

  isOwnHandler(
    handler: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    >,
  ) {
    return this._handlerState.isOwnHandler(handler)
  }

  executePressed(event: KeyEvent<OriginalEvent, KeyEventProps>) {
    if (
      !this._isPressedWithFinalUnit?.has(event.key) &&
      !event.aliases?.some((a) => this._isPressedWithFinalUnit?.has(a))
    )
      return
    this._handlerState.executePressed(
      this._wrapEvent(this._lastActiveKeyPresses, {
        key: event.key,
        aliases: new Set(event.aliases),
        event,
      }),
    )
  }

  executeReleased(event: KeyEvent<OriginalEvent, KeyEventProps>) {
    if (
      !this._isPressedWithFinalUnit?.has(event.key) &&
      !event.aliases?.some((a) => this._isPressedWithFinalUnit?.has(a))
    )
      return
    this._handlerState.executeReleased(
      this._wrapEvent(this._lastActiveKeyPresses, {
        key: event.key,
        aliases: new Set(event.aliases),
        event,
      }),
    )
    this._isPressedWithFinalUnit = null
  }

  updateState(
    activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[],
    sequenceTimeout: number,
  ) {
    const activeKeysCount = activeKeyPresses.length
    const hasReleasedKeys = activeKeysCount < this._lastActiveKeyCount
    this._lastActiveKeyCount = activeKeysCount

    const reset = () => {
      this._resetProgress()

      // In the case of key combos that are used by checkKeyCombo, we need to
      // clear the final unit for it because the executeReleased will not be
      // called.
      if (this._handlerState.isEmpty) {
        this._isPressedWithFinalUnit = null
      }
    }

    // A partially typed combo must not stay armed indefinitely. Without this, once
    // the user has typed "control + k" the combo waits forever, and whichever
    // single key they press next — minutes later — completes it instead of firing
    // its own handler.
    if (
      this._sequenceAdvancedAt !== 0 &&
      this._sequenceAdvancedAt + sequenceTimeout < Date.now()
    ) {
      reset()
    }

    const sequence = this._parsedKeyCombo[this._sequenceIndex]
    const previousUnits = sequence.slice(0, this._unitIndex)
    const remainingUnits = sequence.slice(this._unitIndex)

    let activeKeyIndex = 0

    // if we do not have new keys pressed, and we are not advancing to the next
    // sequence, then we reset. If we are advancing to the next sequence but
    // the timeout has passed then we reset. If no keys are pressed then we
    // advance to the next sequence.
    if (hasReleasedKeys) {
      if (this._movingToNextSequenceAt === 0) return reset()
      if (this._movingToNextSequenceAt + sequenceTimeout < Date.now()) return
      if (activeKeysCount !== 0) return
      this._movingToNextSequenceAt = 0
      this._sequenceIndex += 1
      this._sequenceAdvancedAt = Date.now()
      this._unitIndex = 0
      return
    }

    // NOTE[held-key-blocks-single-key-combos]: matching below is positional — each
    // unit is only searched in the window starting at activeKeyIndex. Consequence:
    // while any unrelated key is held, no single key combo matches at all. This is
    // intended for now (`b` must not fire while space is held). If it is ever
    // deemed unwanted, this is the place to change: scan the whole activeKeyPresses
    // list and track which entries have already been consumed.

    // go through each each previous unit. If any are no longer pressed then
    // we reset to the beginning of the combo.
    for (const previousUnit of previousUnits) {
      for (const key of previousUnit) {
        let keyFound = false
        for (
          let i = activeKeyIndex;
          i < activeKeyPresses.length &&
          i < activeKeyIndex + previousUnit.length;
          i += 1
        ) {
          if (
            activeKeyPresses[i].key === key ||
            activeKeyPresses[i].aliases.has(key)
          ) {
            keyFound = true
            break
          }
        }

        if (!keyFound) return reset()
      }
      activeKeyIndex += previousUnit.length
    }

    // If we are already marked to move to the next sequence then we will stop
    // here. When moving to the next sequence we only need to make sure that
    // the keys in the current sequence are still pressed.
    if (this._movingToNextSequenceAt !== 0) return

    // loop through the remaining units. For each unit that is pressed, advance
    // the unit counter. If all units are pressed then advance the sequence.
    for (const unit of remainingUnits) {
      for (const key of unit) {
        let keyFound = false
        for (
          let i = activeKeyIndex;
          i < activeKeyPresses.length && i < activeKeyIndex + unit.length;
          i += 1
        ) {
          if (
            activeKeyPresses[i].key === key ||
            activeKeyPresses[i].aliases.has(key)
          ) {
            keyFound = true
            break
          }
        }

        // if the unit is incomplete do nothing, the user could still press
        // the remaining keys.
        if (!keyFound) return
      }
      this._unitIndex += 1
      activeKeyIndex += unit.length
    }

    // Now that we have completed the sequence we need to check for overshoot.
    // If there are any keys pressed that are not in the current sequence then
    // we reset.
    if (activeKeyIndex < activeKeysCount - 1) return reset()

    // store the active key presses for the sequence so they can be used in
    // the event.
    this._lastActiveKeyPresses[this._sequenceIndex] = activeKeyPresses.slice(0)

    // Now that we know the sequence is complete we need to check to see if
    // we can advance to the next sequence. If there is no sequence to advance
    // to then we set the final unit.
    if (this._sequenceIndex < this._parsedKeyCombo.length - 1) {
      this._movingToNextSequenceAt = Date.now()
      return
    }

    // Setting the final unit marks the combo as active. It also allows for
    // something to match key repeat against.
    this._isPressedWithFinalUnit = new Set(sequence[sequence.length - 1])

    // The combo is complete, so it is no longer partially typed.
    this._sequenceAdvancedAt = 0
  }

  _wrapEvent(
    activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][],
    finalKeyPress: KeyPress<OriginalEvent, KeyEventProps>,
  ): KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps> {
    const mappedEventProps = this._keyComboEventMapper(
      activeKeyPresses,
      finalKeyPress,
    )
    return {
      ...mappedEventProps,
      keyCombo: this._normalizedKeyCombo,
      keyEvents: activeKeyPresses.flat().map((p) => p.event),
      finalKeyEvent: finalKeyPress.event,
    }
  }
}
