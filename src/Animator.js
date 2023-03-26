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