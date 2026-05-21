import type { KeyEvent, Handler } from './handler-state';
import { KeyPress, KeyComboEventMapper } from './keystrokes';
export type KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps> = KeyComboEventProps & {
    keyCombo: string;
    keyEvents: KeyEvent<OriginalEvent, KeyEventProps>[];
    finalKeyEvent: KeyEvent<OriginalEvent, KeyEventProps>;
};
export declare class KeyComboState<OriginalEvent, KeyEventProps, KeyComboEventProps> {
    private static _parseCache;
    private static _normalizationCache;
    static parseKeyCombo(keyComboStr: string): string[][][];
    static stringifyKeyCombo(keyCombo: string[][][]): string;
    static normalizeKeyCombo(keyComboStr: string): string;
    get isPressed(): boolean;
    get sequenceIndex(): number;
    get sequenceLength(): number;
    private _normalizedKeyCombo;
    private _parsedKeyCombo;
    private _handlerState;
    private _keyComboEventMapper;
    private _movingToNextSequenceAt;
    private _sequenceIndex;
    private _unitIndex;
    private _lastActiveKeyPresses;
    private _lastActiveKeyCount;
    private _isPressedWithFinalUnit;
    constructor(keyCombo: string, keyComboEventMapper: KeyComboEventMapper<OriginalEvent, KeyEventProps, KeyComboEventProps>, handler?: Handler<KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>>);
    isOwnHandler(handler: Handler<KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>>): boolean;
    executePressed(event: KeyEvent<OriginalEvent, KeyEventProps>): void;
    executeReleased(event: KeyEvent<OriginalEvent, KeyEventProps>): void;
    updateState(activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[], sequenceTimeout: number): void;
    _wrapEvent(activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][], finalKeyPress: KeyPress<OriginalEvent, KeyEventProps>): KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>;
}
