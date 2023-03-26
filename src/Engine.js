const {sin, cos, tan, PI, atan, atan2, sqrt, abs, ceil, min, max} = Math;

class PhygicEngine extends EventTarget {
    /*** @type {PhygicObject[]} */
    objects = [];
    gravityAcceleration = 9.801;
    airDensity = .1;
    /*** @type {HTMLCanvasElement | null} */
    canvas = null;
    /*** @type {{translation: {x: number, y: number}}} */
    renderOptions = {
        translation: {x: 0, y: 0},
        scale: {x: 1, y: 1}
    };
    __animators = {
        update: null, render: null
    };
    /**
     * @type {PhygicCanvasResizer | null}
     * @private
     */
    __canvas_resizer = null;
    /**
     * @type {PhygicMouseEvents | null}
     * @private
     */
    __mouse_events = null;
    /**
     * @type {PhygicKeyboardEvents | null}
     * @private
     */
    __keyboard_events = null;
    maxDeltaTime = 0.5;

    /*** @param {{canvas?: HTMLCanvasElement, doUpdate?: boolean, doRender?: boolean, resizeCanvas?: boolean, mouseEvents?: boolean, keyboardEvents?: boolean, gravityAcceleration?: number, airDensity?: number, renderOptions?: {translation: {x: number, y: number}}}} options */
    constructor(options = {}) {
        super();
        const keys = ["canvas", "gravityAcceleration", "airDensity", "renderOptions"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!gotKeys.includes(key)) continue;
            this[key] = options[key];
        }
        if (options["doUpdate"] || !gotKeys.includes("doUpdate")) this.__animators.update = new PhygicAnimator(dt => this.update(dt));
        if (options["doRender"] || !gotKeys.includes("doRender")) this.__animators.render = new PhygicAnimator(() => this.render(), "frame");
        if (options["resizeCanvas"] && this.canvas) this.__canvas_resizer = new PhygicCanvasResizer(this.canvas);
        if (options["mouseEvents"] && this.canvas) this.__mouse_events = new PhygicMouseEvents(this);
        if (options["keyboardEvents"] && this.canvas) this.__keyboard_events = new PhygicKeyboardEvents(this);
    };

    /*** @returns {CanvasRenderingContext2D} */
    get ctx() {
        if (this.__ctx__ && this.__ctx__.canvas === this.canvas) return this.__ctx__;
        return this.__ctx__ = this.canvas.getContext("2d");
    };

    /*** @param {number} dt */
    update(dt) {
        if (dt > this.maxDeltaTime) dt = this.maxDeltaTime;
        const ev = new Event("update");
        ev.dt = dt;
        this.dispatchEvent(ev);
        if (!ev.defaultPrevented) for (let i = 0; i < this.objects.length; i++) this.objects[i].update(dt);
        const ev2 = new Event("afterUpdate");
        ev2.dt = dt;
        this.dispatchEvent(ev2);
    };

    render() {
        if (!this.canvas) throw new Error("Couldn't find the canvas to render!");
        const ev = new Event("render");
        this.dispatchEvent(ev);
        if (!ev.defaultPrevented) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (let i = 0; i < this.objects.length; i++) this.objects[i].render();
        }
        const ev2 = new Event("afterRender");
        this.dispatchEvent(ev2);
    };

    addObject(...objects) {
        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            if (this.objects.includes(object)) continue;
            this.objects.push(object);
        }
    };

    /*** @param {PhygicObject} objects */
    removeObject(...objects) {
        for (let i = 0; i < objects.length; i++) this.objects.splice(this.objects.indexOf(objects[i]), 1);
    };

    /*** @returns {PhygicMouseEvents | null} */
    get mouseManager() {
        return this.__mouse_events;
    };

    /*** @returns {PhygicKeyboardEvents | null} */
    get keyboardManager() {
        return this.__keyboard_events;
    };

    get mouse() {
        return new PhygicMouse(this.mouseManager);
    };

    get keyboard() {
        return new PhygicKeyboard(this.keyboardManager);
    };
}