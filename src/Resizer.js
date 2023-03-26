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