class PhygicMouseEvents {
    _listeners = [];

    /*** @param {PhygicEngine} engine */
    constructor(engine) {
        this.engine = engine;
        this._mouseDown = false;
        this._mousePos = [0, 0];
        this.registerEvents();
    };

    get mouseDown() {
        return this._mouseDown;
    };

    get mouseX() {
        return this._mousePos[0] + this.engine.renderOptions.translation.x;
    };

    get mouseY() {
        return -this._mousePos[1] + this.engine.renderOptions.translation.y;
    };

    get absoluteMouseX() {
        return this._mousePos[0];
    };

    get absoluteMouseY() {
        return this._mousePos[1];
    };

    registerEvents() {
        const l = (ev, k, target = this.engine.canvas) => {
            target.addEventListener(ev, k);
            this._listeners.push([target, ev, k]);
        };
        l("mousedown", () => this._mouseDown = true);
        l("mousemove", e => {
            this._mousePos[0] = e.offsetX;
            this._mousePos[1] = e.offsetY;
            if (!this._mouseDown) return;
            this.engine.renderOptions.translation.x -= e.movementX;
            this.engine.renderOptions.translation.y += e.movementY;
        });
        l("mouseup", () => this._mouseDown = false);
        let lastTouch = null;
        l("touchstart", e => lastTouch = e.touches[0]);
        l("touchmove", e => {
            this._mousePos[0] = e.offsetX;
            this._mousePos[1] = e.offsetY;
            const touch = e.touches[0];
            this.engine.renderOptions.translation.x -= touch.offsetX - lastTouch.offsetX;
            this.engine.renderOptions.translation.y += touch.offsetY - lastTouch.offsetY;
        });
        l("wheel", e => {
            e.preventDefault();
            if (this.engine.keyboardManager && this.engine.keyboard.isPressing("control")) {
                // noinspection JSSuspiciousNameCombination
                this.engine.renderOptions.scale.x *= e.deltaY; // TODO: zoom
                this.engine.renderOptions.scale.y *= e.deltaY;
            } else {
                this.engine.renderOptions.translation.x += e.deltaX;
                this.engine.renderOptions.translation.y -= e.deltaY;
            }
        });
        l("blur", () => this._mouseDown = false, window);
        l("contextmenu", e => e.preventDefault());
    };

    unregisterEvents() {
        for (let i = 0; i < this._listeners.length; i++) this._listeners[i][0].removeEventListener(this._listeners[i][1], this._listeners[i][2]);
    };
}

class PhygicMouse {
    /*** @param {PhygicMouseEvents} manager */
    constructor(manager) {
        this.manager = manager;
    };

    get x() {
        return this.manager.mouseX;
    };

    get y() {
        return this.manager.mouseY;
    };

    get absoluteX() {
        return this.manager.absoluteMouseX;
    };

    get absoluteY() {
        return this.manager.absoluteMouseY;
    };
}