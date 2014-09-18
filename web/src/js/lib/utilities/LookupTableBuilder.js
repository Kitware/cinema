(function () {
    /**
     * The LookupTableBuilder is used to generate lookup table
     * function based on a set of control points. A lookup table
     * function is a function that take a number between 0 and 1
     * and will return [r, g, b] array where each value is
     * between 0-255.
     */
    cinema.utilities.LookupTableBuilder = function () {
        return this;
    };

    var prototype = cinema.utilities.LookupTableBuilder.prototype;

    function applyRatio(a, b, ratio) {
        return ((b - a) * ratio) + a;
    }

    function interpolateColor(pointA, pointB, value) {
        var ratio = (value - pointA[0]) / (pointB[0] - pointA[0]);
        return [ applyRatio(pointA[1], pointB[1], ratio),
                 applyRatio(pointA[2], pointB[2], ratio),
                 applyRatio(pointA[3], pointB[3], ratio) ];
    }

    function extractPoint(controlPoints, idx) {
        return [ controlPoints[idx * 4], controlPoints[idx * 4 + 1], controlPoints[idx * 4 + 2], controlPoints[idx * 4 + 3] ];
    }

    /**
     * Generate the Lookup Table function
     *
     * @param newVizModel The current active Visualization Model.
     */
    prototype.buildLUT = function (controlPoints) {
        var table = [],
            currentControlIdx = 0;
        for (var idx = 0; idx < 256; idx += 1) {
            var value = idx / 255.0,
                pointA = extractPoint(controlPoints, currentControlIdx),
                pointB = extractPoint(controlPoints, currentControlIdx + 1);

            if (value > pointB[0]) {
                currentControlIdx += 1;
                pointA = extractPoint(controlPoints, currentControlIdx);
                pointB = extractPoint(controlPoints, currentControlIdx + 1);
            }

            table.push(interpolateColor(pointA, pointB, value));
        }

        return function (scalar) {
            return table[Math.floor(scalar * 255)];
        };
    };

}());
