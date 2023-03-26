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