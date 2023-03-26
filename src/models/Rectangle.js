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