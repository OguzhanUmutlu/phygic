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