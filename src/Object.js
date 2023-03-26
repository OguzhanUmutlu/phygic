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