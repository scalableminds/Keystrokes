import { KeyEvent } from './handler-state';
import { KeyComboEvent } from './key-combo-state';
import { OnActiveEventBinder, OnKeyEventBinder } from './keystrokes';
export type BrowserKeyEventProps = {
    composedPath(): EventTarget[];
    preventDefault(): void;
};
export type BrowserKeyEvent = KeyEvent<KeyboardEvent, BrowserKeyEventProps>;
export type BrowserKeyComboEvent = KeyComboEvent<KeyboardEvent, BrowserKeyEventProps, {}>;
export type BrowserKeyComboEventProps = {};
export type MaybeBrowserKeyEventProps<OriginalEvent> = OriginalEvent extends KeyboardEvent ? BrowserKeyEventProps : {};
export type MaybeBrowserKeyComboEventProps<OriginalEvent> = OriginalEvent extends KeyboardEvent ? BrowserKeyComboEventProps : {};
export declare const browserOnActiveBinder: OnActiveEventBinder;
export declare const browserOnInactiveBinder: OnActiveEventBinder;
export declare const browserOnKeyPressedBinder: OnKeyEventBinder<KeyboardEvent, BrowserKeyEventProps>;
export declare const browserOnKeyReleasedBinder: OnKeyEventBinder<KeyboardEvent, BrowserKeyEventProps>;
