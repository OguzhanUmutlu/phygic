class PhygicKeyboardEvents {
    _listeners = [];

    /*** @param {PhygicEngine} engine */
    constructor(engine) {
        this.engine = engine;
        this._keys = {};
        this._lowerKeys = {};
        this.registerEvents();
    };

    registerEvents() {
        const l = (ev, k, target = this.engine.canvas) => {
            target.addEventListener(ev, k);
            this._listeners.push([target, ev, k]);
        };
        l("keydown", e => {
            this._keys[e.key] = true;
            this._lowerKeys[e.key.toLowerCase()] = true;
        }, window);
        l("keypress", e => {
            this._keys[e.key] = true;
            this._lowerKeys[e.key.toLowerCase()] = true;
        }, window);
        l("keyup", e => {
            this._keys[e.key] = false;
            this._lowerKeys[e.key.toLowerCase()] = false;
        }, window);
        l("blur", () => {
            this._keys = {};
            this._lowerKeys = {};
        }, window);
    };

    unregisterEvents() {
        for (let i = 0; i < this._listeners.length; i++) this._listeners[i][0].removeEventListener(this._listeners[i][1], this._listeners[i][2]);
    };
}

class PhygicKeyboard {
    /*** @param {PhygicKeyboardEvents} manager */
    constructor(manager) {
        this.manager = manager;
    };

    isPressing(key) {
        return !!this.manager._lowerKeys[key.toLowerCase()];
    };

    isPressingAbsolute(key) {
        return !!this.manager._keys[key];
    };
}