export type KeyEvent<OriginalEvent, KeyEventProps> = KeyEventProps & {
    key: string;
    aliases?: string[];
    originalEvent?: OriginalEvent;
};
export type HandlerFn<Event> = (event: Event) => void;
export type HandlerObj<Event> = {
    onPressed?: HandlerFn<Event>;
    onPressedWithRepeat?: HandlerFn<Event>;
    onReleased?: HandlerFn<Event>;
};
export type Handler<Event> = HandlerFn<Event> | HandlerObj<Event>;
export declare class HandlerState<Event> {
    _onPressed?: HandlerFn<Event>;
    _onPressedWithRepeat?: HandlerFn<Event>;
    _onReleased?: HandlerFn<Event>;
    _isPressed: boolean;
    _identity: Handler<Event>;
    constructor(handler: Handler<Event>);
    get isEmpty(): boolean;
    isOwnHandler(handler: Handler<Event>): boolean;
    executePressed(event: Event): void;
    executeReleased(event: Event): void;
}
