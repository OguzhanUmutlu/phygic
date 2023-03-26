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