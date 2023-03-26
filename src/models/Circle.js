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