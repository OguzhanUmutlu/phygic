class PhygicAnimator {
    animating = false;
    method = "timeout";
    speed = 1;
    deltaSpeed = 1;
    currentId;
    last = -1;
    _updates = [];

    /**
     * @param {Function | Function[]} functions
     * @param {"timeout" | "frame"} method
     */
    constructor(functions, method = "timeout") {
        this.functions = Array.isArray(functions) ? functions : [functions];
        this.setUpdateMethod(method);
    };

    /**
     * @private
     * @internal
     */
    async __loop__() {
        const run = k => this.method === "timeout" ? setTimeout(k) : requestAnimationFrame(k);
        if (this.speed > 1 || this.speed <= 0) throw new Error("Animator speed should be between 0 and 1! Got: " + this.speed);
        if (this.speed !== 1) for (let i = 0; i * this.speed < 1; i++) await new Promise(r => this.currentId = run(r));
        const dt = (this.last === -1 ? 0 : (performance.now() - this.last) / 1000) * this.deltaSpeed;
        for (let i = 0; i < this.functions.length; i++) this.functions[i](dt);
        this.last = performance.now();
        for (let i = 0; i < this._updates.length; i++) if (this._updates[i] + 1000 < this.last) this._updates.splice(i, 1);
        this._updates.push(this.last);
        this.currentId = run(() => this.__loop__());
    };

    start() {
        if (this.animating) return;
        this.__loop__().then(r => r);
        this.animating = true;
    };

    stop() {
        if (!this.animating) return;
        cancelAnimationFrame(this.currentId);
        clearTimeout(this.currentId);
        this.animating = false;
        this.last = -1;
    };

    setUpdateMethod(method) {
        if (!["timeout", "frame"].includes(method)) throw new Error("Invalid animation method: " + method);
        this.method = method;
        this.stop();
        this.start();
    };

    getUpdateMethod() {
        return this.method;
    };

    setSpeed(speed) {
        return this.speed = speed;
    };

    setDeltaSpeed(speed) {
        this.deltaSpeed = speed;
    };

    getSpeed() {
        return this.speed;
    };

    getDeltaSpeed() {
        return this.deltaSpeed;
    };

    addFunction(...functions) {
        this.functions.push(...functions);
    };

    removeFunction(...functions) {
        for (let i = 0; i < functions.length; i++) this.functions.splice(this.functions.indexOf(functions[i]), 1);
    };

    getUpdatePerSecond() {
        return this._updates.length;
    };
}
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
class PhygicModel {
    /*** @type {PhygicObject | null} */
    object = null;

    /*** @param {{object: PhygicObject | null}} options */
    constructor(options = {}) {
        const keys = ["object"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (gotKeys.includes(key)) this[key] = options[key];
        }
    };

    render() {
    };

    getCollision() {
    };

    /**
     * @param {PhygicModel} model
     * @returns {Object | boolean | null}
     */
    collides(model) {
        if (!model) return null;
        const collision = model.getCollision();
        if (!collision) return null;
        return this.collidesCollision(collision);
    };

    /*** @returns {boolean | Object} */
    collidesCollision(object) {
        return PhygicModel.rawCollision(this.getCollision(), object);
    };

    /**
     * @param {[string, number, number, [number, number][]]} p1
     * @param {[string, number, number, [number, number][]]} p2
     * @returns {boolean}
     */
    static rawCollision(p1, p2) {
        if (p1[0] !== "polygon" || p2[0] !== "polygon") return false;
        const poly1 = [];
        for (let i = 0; i < p1[3].length; i++) poly1.push([p1[3][i][0] + p1[1], p1[3][i][1] + p1[2]]);
        const poly2 = [];
        for (let i = 0; i < p2[3].length; i++) poly2.push([p2[3][i][0] + p2[1], p2[3][i][1] + p2[2]]);

        function getEdges(poly) {
            const edges = [];
            for (let i = 0; i < poly.length; i++) edges.push([poly[i], poly[(i + 1) % poly.length]]);
            return edges;
        }

        function axisProjection(poly, axis) {
            let min = Infinity;
            let max = -Infinity;
            for (let i = 0; i < poly.length; i++) {
                let val = 0;
                for (let j = 0; j < poly[i].length; j++) val += poly[i][j] * axis[j];
                if (val < min) min = val;
                if (val > max) max = val;
            }
            return [min, max];
        }

        const edges = [...getEdges(poly1), ...getEdges(poly2)];
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const axis = [edge[1][1] - edge[0][1], -(edge[1][0] - edge[0][0])];
            const proj1 = axisProjection(poly1, axis);
            const proj2 = axisProjection(poly2, axis);
            if (max(proj1[0], proj1[1]) < min(proj2[0], proj2[1]) || max(proj2[0], proj2[1]) < min(proj1[0], proj1[1])) return false;
        }
        return true;
    };

    /**
     * @param {PhygicObject} object
     * @param {"x" | "y"} xy
     */
    applyCollisionRotation(object, xy) {
        object.velocity[xy] = 0;
    };

    getBottomArea() {
        return 0;
    };
}
class PhygicCircle extends PhygicModel {
    fill = "black";
    stroke = "";
    strokeWidth = 1;
    radius = 10;

    /*** @param {{object?: PhygicObject | null, radius?: number, fill?: string | null, stroke?: string | null, strokeWidth?: number}} options */
    constructor(options = {}) {
        super(options);
        const keys = ["object", "radius", "fill", "stroke", "strokeWidth"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (gotKeys.includes(key)) this[key] = options[key];
        }
    };

    render() {
        if (!this.object) throw new Error("There is no object attached to this model.");
        this.object.engine.ctx.arc(this.object.x, this.object.y, this.radius, 0, PI * 2);
    };

    getCollision() {
        if (!this.object) throw new Error("There is no object attached to this model.");
        return ["circle", this.object.x, this.object.y, this.radius];
    };

    getBottomArea() {
        return PI * this.radius;
    };

    applyCollisionRotation(object, xy) {
        object.velocity[xy] = 0;
    };
}
class PhygicPath extends PhygicModel {
    fill = "black";
    stroke = "";
    strokeWidth = 1;
    __path = [];

    /*** @param {{object?: PhygicObject | null, path?: [number, number][], fill?: string | null, stroke?: string | null, strokeWidth?: number}} options */
    constructor(options = {}) {
        super(options);
        const keys = ["object", "path", "fill", "stroke", "strokeWidth"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (gotKeys.includes(key)) this[key] = options[key];
        }
    };

    recalculateRotatedPath() {
        if (!this.object) throw new Error("There is no object attached to this model.");
        if (isNaN(this.object.rotation)) return;
        const oldPath = this.path;
        const path = [];
        for (let i = 0; i < oldPath.length; i++) {
            const point = oldPath[i];
            const s = sin(this.object.rotation);
            const c = sqrt(1 - s ** 2);
            const x = c * point[0] - s * point[1];
            const y = s * point[0] + c * point[1];
            path[i] = [x, y];
        }
        /**
         * @type {[number, number][]}
         * @private
         */
        this._rotatedPath = path;
        this._lastRotation = this.object.rotation;
    };

    /*** @returns {[number, number][]} */
    get path() {
        return this.__path;
    };

    /*** @param {[number, number][]} p */
    set path(p) {
        this.__path = p;
    };

    render() {
        if (!this.object) throw new Error("There is no object attached to this model.");
        if (!this._rotatedPath || this.object.rotation !== this._lastRotation) this.recalculateRotatedPath();
        this._lastRotation = this.object.rotation;
        const path = this._rotatedPath;
        for (let i = 0; i < path.length; i++) this.object.engine.ctx[i ? "lineTo" : "moveTo"](-path[i][0], path[i][1]);
    };

    getCollision() {
        if (!this.object) throw new Error("There is no object attached to this model.");
        return ["polygon", this.object.x, this.object.y, this._rotatedPath || this.__path];
    };

    getBottomArea() {
        let min = Infinity;
        let max = -Infinity;
        const p = this._rotatedPath || this.path;
        for (let i = 0; i < p.length; i++) {
            const x = p[i][0];
            if (x < min) min = x;
            if (x > max) max = x;
        }
        return max - min;
    };

    /*** @returns {[[number, number], [number, number], Object][]} */
    getEdges() {
        const edges = [];
        const list = this._rotatedPath || this.path;
        for (let i = 0; i < list.length; i++) {
            const l = list[i];
            const next = list[list.length - 1 === i ? 0 : i + 1];
            edges.push([l, next, ["polygon", this.object.x, this.object.y, [l, next]]]);
        }
        return edges;
    }

    /**
     * @param {PhygicObject} object
     * @param {"x" | "y"} xy
     * @returns {{}}
     */
    applyCollisionRotation(object, xy) {
        if (!this.object) throw new Error("There is no object attached to this model.");
        let slope = this.object.rotation;
        if (object.model instanceof PhygicCircle) {
            slope = atan2(object.x - this.object.x, object.y - this.object.y);
        } else if (object.model instanceof PhygicPath) {
            const edges = object.model.getEdges();
            for (let i = 0; i < edges.length; i++) {
                const [from, to, collision] = edges[i];
                if (!this.collidesCollision(collision)) continue;
                const s = (to[1] - from[1]) / (to[0] - from[0]);
                if (abs(s) !== Infinity) slope = s;
            }
        }
        const Cr = 0;
        const m1 = this.object.mass;
        const m2 = object.mass;
        if (xy === "x") {
            const v1 = this.object.velocity.x;
            const v2 = object.velocity.x;
            this.object.velocity.x = PhygicObject.calculateIntersectionVelocity(object.isStatic ? 0 : Cr, m1, m2, v1, v2);
            object.velocity.x = PhygicObject.calculateIntersectionVelocity(this.object.isStatic ? 0 : Cr, m2, m1, v2, v1);
        } else {
            const v1 = this.object.velocity.y;
            const v2 = object.velocity.y;
            this.object.velocity.y = PhygicObject.calculateIntersectionVelocity(object.isStatic ? 0 : Cr, m1, m2, v1, v2);
            object.velocity.y = PhygicObject.calculateIntersectionVelocity(this.object.isStatic ? 0 : Cr, m2, m1, v2, v1);
        }
        if (abs(slope) !== Infinity && !isNaN(slope)) {
            const s = this.object.rotation;
            this.object.rotation = slope;
            if(this.object.collidesAny()) this.object.rotation = s;
        }
    }
}
class PhygicPolygon extends PhygicPath {
    _radius = 10;

    /*** @param {{object?: PhygicObject | null, sides?: number, radius?: number, path?: [number, number][], fill?: string | null, stroke?: string | null, strokeWidth?: number}} options */
    constructor(options = {}) {
        super(options);
        if (!options.sides) options.sides = 4;
        const keys = ["object", "sides", "radius"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (gotKeys.includes(key)) this[key] = options[key];
        }
    };

    get radius() {
        return this._radius;
    };

    get sides() {
        return this._sides;
    };

    set sides(s) {
        this._sides = s;
        const path = [];
        const newPath = [];
        const r = this.radius;
        for (let i = 0; i < s; i++) {
            const p = [
                sin(i / s * PI * 2),
                cos(i / s * PI * 2)
            ];
            path.push(p);
            newPath.push([p[0] * r, p[1] * r]);
        }
        this._poly_path = path;
        this.path = newPath;
    };

    set radius(r) {
        this._radius = r;
        const newPath = [];
        for (let i = 0; i < this._poly_path.length; i++) {
            const p = this._poly_path[i];
            newPath.push([p[0] * r, p[1] * r]);
        }
        this.path = newPath;
    };
}
class PhygicRectangle extends PhygicPath {
    _width = 0;
    _height = 0;

    /*** @param {{object?: PhygicObject | null, width?: number, height?: number, path?: [number, number][], fill?: string | null, stroke?: string | null, strokeWidth?: number}} options */
    constructor(options = {}) {
        super(options);
        if (!options.width) options.width = 10;
        if (!options.height) options.height = 10;
        const keys = ["object", "width", "height"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (gotKeys.includes(key)) this[key] = options[key];
        }
    };

    get width() {
        return this._width;
    };

    get height() {
        return this._height;
    };

    set width(w) {
        if (this._width === w) return;
        this._width = w;
        this._recalculateRectangle();
    };

    set height(h) {
        if (this._height === h) return;
        this._height = h;
        this._recalculateRectangle();
    };

    _recalculateRectangle() {
        this.path = [
            [-this.width / 2, -this.height / 2],
            [this.width / 2, -this.height / 2],
            [this.width / 2, this.height / 2],
            [-this.width / 2, this.height / 2]
        ];
    };
}
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
class PhygicObject {
    x = 0;
    y = 0;
    rotation = 0;
    velocity = {x: 0, y: 0};
    force = {x: 0, y: 0};
    angularVelocity = 0;
    mass = 10;
    kineticFrictionCoefficient = 0.5;
    isStatic = false;
    /*** @type {PhygicModel | PhygicCircle | PhygicPath | PhygicPolygon} */
    model = null;

    /**
     * @param {PhygicEngine} engine
     * @param {{x?: number, y?: number, rotation?: number, velocity?: {x: number, y: number}, angularVelocity?: number, mass?: number, isStatic?: boolean, model?: PhygicModel | null}} options
     */
    constructor(engine, options = {}) {
        this.engine = engine;
        engine.addObject(this);
        const keys = ["x", "y", "rotation", "velocity", "angularVelocity", "mass", "isStatic", "model"];
        const gotKeys = Object.keys(options);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!gotKeys.includes(key)) continue;
            this[key] = options[key];
            if (key === "model") options[key].object = this;
        }
    };

    isOnGround(precision = 0.01) {
        this.y -= precision;
        const groundObject = this.collidesAny();
        this.y += precision;
        return !!groundObject;
    };

    /*** @param {number} dt */
    update(dt) {
        if (this.isStatic) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            return;
        }
        this.velocity.y -= this.engine.gravityAcceleration * dt;
        const airDensity = this.engine.airDensity * this.getBottomArea() * this.velocity.y ** 2 / this.mass * dt;
        if (this.velocity.y < 0) {
            if (-this.velocity.y > airDensity) this.velocity.y += airDensity;
            else this.velocity.y = 0;
        }
        if (abs(this.velocity.x) > 0.00001) {
            if (this.isOnGround()) {
                const before = this.velocity.x > 0;
                const acc = (before ? -1 : 1) * this.kineticFrictionCoefficient * this.engine.gravityAcceleration * cos(this.rotation) * dt;
                this.velocity.x += acc;
                if (before !== (this.velocity.x > 0)) this.velocity.x = 0;
            }
            this.move(this.velocity.x, 0);
        }
        if (abs(this.velocity.y) > 0.00001) this.move(0, this.velocity.y);
        if (this.y < -500) {
            this.y = -500;
            this.velocity.y = 0;
        }
        this.rotation += this.angularVelocity * dt;
        if (this.move(0, 0).any) this.rotation -= this.angularVelocity * dt;
    };

    render() {
        if (!this.model) return;
        this.model.object = this;
        const engine = this.engine;
        const ctx = engine.ctx;
        ctx.save();
        ctx.translate(this.x - engine.renderOptions.translation.x, -this.y + engine.renderOptions.translation.y);
        ctx.scale(engine.renderOptions.scale.x, engine.renderOptions.scale.y);
        ctx.beginPath();
        ctx.fillStyle = this.model.fill;
        ctx.strokeStyle = this.model.stroke;
        ctx.lineWidth = this.model.strokeWidth;
        this.model.render();
        if (this.model.fill) ctx.fill();
        if (this.model.stroke) ctx.stroke();
        ctx.closePath();
        ctx.restore();
    };

    /**
     * @param {PhygicObject} object
     * @returns {Object | boolean | null}
     */
    collides(object) {
        if (!this.model) return null;
        return this.model.collides(object.model);
    };

    /*** @returns {PhygicObject | null} */
    collidesAny() {
        const objects = this.engine.objects;
        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            if (obj !== this && this.collides(obj)) return obj;
        }
        return null;
    };

    /**
     * @param dx
     * @param dy
     * @returns {{}}
     */
    move(dx, dy) {
        const radian = atan2(dx, dy);
        const rep = 30;
        const dist = sqrt(dx ** 2 + dy ** 2);
        const vec = [sin(radian) * dist / rep, cos(radian) * dist / rep];
        const cols = {x: null, y: null};
        for (let i = 0; i < rep; i++) {
            if (!cols.x) {
                this.x += vec[0];
                let cl = this.collidesAny();
                if (cl) {
                    this.model.applyCollisionRotation(cl, "x");
                    cols.x = cl;
                    this.x -= vec[0];
                }
            }
            if (!cols.y) {
                this.y += vec[1];
                let cl = this.collidesAny();
                if (cl) {
                    this.model.applyCollisionRotation(cl, "y");
                    cols.y = cl;
                    this.y -= vec[1];
                }
            }
            if (cols.x && cols.y) break;
        }
        cols.any = cols.x || cols.y;
        return cols;
    };

    getBottomArea() {
        if (!this.model) return 0;
        return this.model.getBottomArea();
    };

    getRadianTo(x, y) {
        return atan2(x - this.x, y - this.y);
    };

    turnAt(x, y) {
        this.rotation = this.getRadianTo(x, y);
    };

    getDirectionVectorTo(x, y) {
        const radian = this.getRadianTo(x, y);
        return {x: sin(radian), y: cos(radian)};
    };

    getDirectionVector() {
        return {x: sin(this.rotation), y: cos(this.rotation)};
    };

    static calculateIntersectionVelocity(c, ma, mb, va, vb) {
        return (c * mb * (vb - va) + ma * va + mb * vb) / (ma + mb);
    };

    static calculateDirectionVector(x1, y1, x2, y2) {
        const radian = atan2(x1 - x2, y1 - y2);
        return [sin(radian), cos(radian)];
    };
}
class PhygicCanvasResizer {
    __listener;

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {boolean} maximize
     * @param {boolean} center
     */
    constructor(canvas, maximize = true, center = true) {
        this.canvas = canvas;
        this.maximize = maximize;
        this.center = center;
    };

    get maximize() {
        return this._maximize;
    };

    set maximize(m) {
        if (m === this._maximize) return;
        this._maximize = m;
        if (this.__listener) removeEventListener("resize", this.__listener);
        if (m) {
            addEventListener("resize", this.__listener = () => {
                this.canvas.width = innerWidth;
                this.canvas.height = innerHeight;
            });
            this.canvas.width = innerWidth;
            this.canvas.height = innerHeight;
            this.canvas.style.width = "100%";
            this.canvas.style.height = "100%";
        } else {
            this.canvas.style.width = "";
            this.canvas.style.height = "";
        }
    };

    get center() {
        return this._center;
    };

    set center(c) {
        if (c === this._center) return;
        this._center = c;
        if (c) {
            this.canvas.style.position = "absolute";
            this.canvas.style.left = "0";
            this.canvas.style.top = "0";
        } else {
            this.canvas.style.position = "";
            this.canvas.style.left = "";
            this.canvas.style.top = "";
            this.canvas.style.transform = "";
        }
    };
}