import { MaybeBrowserKeyComboEventProps, MaybeBrowserKeyEventProps } from './browser-bindings';
import { Handler, KeyEvent } from './handler-state';
import { KeyComboEvent } from './key-combo-state';
export declare const defaultSequenceTimeout = 1000;
export type OnActiveEventBinder = (handler: () => void) => (() => void) | void;
export type OnKeyEventBinder<OriginalEvent, KeyEventProps> = (handler: (event: KeyEvent<OriginalEvent, KeyEventProps>) => void) => (() => void) | void;
export type KeyComboEventMapper<OriginalEvent, KeyEventProps, KeyComboEventProps> = (activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][], finalKeyPress: KeyPress<OriginalEvent, KeyEventProps>) => KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>;
export type KeyPress<OriginalEvent, KeyEventProps> = {
    key: string;
    aliases: Set<string>;
    identity?: string;
    event: KeyEvent<OriginalEvent, KeyEventProps>;
};
export type KeystrokesOptions<OriginalEvent = KeyboardEvent, KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>, KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>> = BindEnvironmentOptions<OriginalEvent, KeyEventProps, KeyComboEventProps>;
export type BindEnvironmentOptions<OriginalEvent = KeyboardEvent, KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>, KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>> = {
    onActive?: OnActiveEventBinder;
    onInactive?: OnActiveEventBinder;
    onKeyPressed?: OnKeyEventBinder<OriginalEvent, KeyEventProps>;
    onKeyReleased?: OnKeyEventBinder<OriginalEvent, KeyEventProps>;
    mapKeyComboEvent?: KeyComboEventMapper<OriginalEvent, KeyEventProps, KeyComboEventProps>;
    selfReleasingKeys?: string[];
    keyRemap?: Record<string, string>;
};
export declare class Keystrokes<OriginalEvent = KeyboardEvent, KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>, KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>> {
    sequenceTimeout: number;
    private _isActive;
    private _unbinder;
    private _onActiveBinder;
    private _onInactiveBinder;
    private _onKeyPressedBinder;
    private _onKeyReleasedBinder;
    private _keyComboEventMapper;
    private _selfReleasingKeys;
    private _keyRemap;
    private _handlerStates;
    private _keyComboStates;
    private _keyComboStatesArray;
    private _activeKeyPresses;
    private _activeKeyMap;
    private _watchedKeyComboStates;
    private _keyCombosPressedByKey;
    constructor(options?: KeystrokesOptions<OriginalEvent, KeyEventProps, KeyComboEventProps>);
    get pressedKeys(): string[];
    bindKey(key: string | string[], handler: Handler<KeyEvent<OriginalEvent, KeyEventProps>>): void;
    unbindKey(key: string | string[], handler?: Handler<KeyEvent<OriginalEvent, KeyEventProps>>): void;
    bindKeyCombo(keyCombo: string | string[], handler: Handler<KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>>): void;
    unbindKeyCombo(keyCombo: string | string[], handler?: Handler<KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>>): void;
    checkKey(key: string): boolean;
    checkKeyCombo(keyCombo: string): boolean;
    checkKeyComboSequenceIndex(keyCombo: string): number;
    bindEnvironment(options?: BindEnvironmentOptions<OriginalEvent, KeyEventProps, KeyComboEventProps>): void;
    unbindEnvironment(): void;
    /**
     * Releases every key currently believed to be held and abandons any progress
     * through a key combo. Call this whenever keyups may have been missed — the
     * page regaining focus, or a modal that stopped propagation of key events.
     *
     * Without a way to do this a single missed keyup is unrecoverable: a stranded
     * key stops all single key combos from matching, and a combo left marked as
     * pressed keeps suppressing shorter combos (see the readme).
     */
    releaseAllKeys(): void;
    private _ensureCachedKeyComboState;
    private _normalizeEvent;
    private _identityOf;
    private _handleKeyPress;
    private _handleKeyRelease;
    private _identityOfKeyPress;
    private _updateKeyComboStates;
    private _tryReleaseSelfReleasingKeys;
}
