/**
 * Represents a cinema rendering options. Stores the required info in the model's
 * attributes.
 */
cinema.models.RenderingModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.url = settings.url;
        this.ranges = settings.ranges;
        this.colorByFields = settings.fields;

        this.lutMap = {};
    },

    defaults: {
    },

    initializeLookupTables: function() {
        var that = this;
        _.each(this.colorByFields, function(fieldName) {
            that.initializeLutForFieldToPreset(fieldName, 'spectral');
        });
    },

    ensureLookupTablesReady: function() {
        if (_.isEmpty(this.lutMap)) {
            this.initializeLookupTables();
        }
    },

    initializeLutForFieldToPreset: function(fieldName, presetName) {
        var controlPoints = this.getControlPoints(presetName);
        if (controlPoints !== 'no-match') {
            var controlPointsArray = $.extend(true, [], controlPoints);
            var range = this.getRangeForField(fieldName);
            if (range !== null) {
                this.lutMap[fieldName] = {
                    'controlPoints': controlPointsArray,
                    'clampedRange': range,
                    'dataRange': range
                };
                this._invalidateTable(fieldName);
                return true;
            }
        }
        return false;
    },

    getLookupTableForField: function(fieldName) {
        this.ensureLookupTablesReady();
        if (_.has(this.lutMap, fieldName)) {
            return this.getLutFunction(this.lutMap[fieldName]);
        }
        return null;
    },

    getControlPointsForField: function(fieldName) {
        if (_.has(this.lutMap, fieldName)) {
            return this.lutMap[fieldName].controlPoints;
        }
        return null;
    },

    getClampedRangeForField: function(fieldName) {
        if (_.has(this.lutMap, fieldName)) {
            return this.lutMap[fieldName].clampedRange;
        }
        return null;
    },

    setClampedRangeForField: function(fieldName, clampedRange) {
        if (_.has(this.lutMap, fieldName)) {
            this.lutMap[fieldName].clampedRange = clampedRange;
            this._invalidateTable(fieldName);
        }
    },

    getRangeForField: function(fieldName) {
        if (_.has(this.ranges, fieldName)) {
            return this.ranges[fieldName];
        }
        return null;
    },

    getFields: function() {
        this.ensureLookupTablesReady();
        return this.colorByFields;
    },

    loaded: function () {
        return this.has('swatches');
    },

    url: function () {
        return this.url;
    },

    getData: function (name) {
        if(this.loaded()) {
            return this.get(name);
        }
        return 'no-match';
    },

    getPresetNames: function() {
        if (this.loaded()) {
            return _.keys(this.get('lookuptables'));
        }
        return [];
    },

    getControlPoints: function (name) {
        if(this.loaded()) {
            return this.get('lookuptables')[name].controlpoints;
        }
        return 'no-match';
    },

    applyRatio: function (a, b, ratio) {
        return ((b - a) * ratio) + a;
    },

    interpolateColor: function (pointA, pointB, value) {
        var ratio = (value - pointA[0]) / (pointB[0] - pointA[0]);
        return [ this.applyRatio(pointA[1], pointB[1], ratio) * 255,
                 this.applyRatio(pointA[2], pointB[2], ratio) * 255,
                 this.applyRatio(pointA[3], pointB[3], ratio) * 255 ];
    },

    extractPoint: function (controlPoints, idx) {
        return [ controlPoints[idx].x, controlPoints[idx].r, controlPoints[idx].g, controlPoints[idx].b ];
    },

    getLutFunction: function(config) {
        var table =  [],
            controlPoints = $.extend(true, [], config.controlPoints),
            clampedRange = config.clampedRange,
            dataRange = config.dataRange,
            currentControlIdx = 0,
            needRemap = false,
            minIdx = 0,
            maxIdx = 0,
            nbColorInTable = 256; // Can be increased

        // If there is a min clamp, insert a new control point and mark that remap is needed
        if (clampedRange[0] > dataRange[0]) {
            var cp1 = controlPoints[0];
            var frac1 = (clampedRange[0] - dataRange[0]) / (dataRange[1] - dataRange[0]);
            controlPoints.splice(1, 0, {'r': cp1.r, 'g': cp1.g, 'b': cp1.b, 'x': frac1});
            needRemap = true;
            minIdx = 1;
        }

        // Ditto if there is a max clamp
        if (clampedRange[1] < dataRange[1]) {
            var cpn = controlPoints[controlPoints.length - 1];
            var fracn = (clampedRange[1] - dataRange[0]) / (dataRange[1] - dataRange[0]);
            controlPoints.splice(controlPoints.length - 1, 0, {'r': cpn.r, 'g': cpn.g, 'b': cpn.b, 'x': fracn});
            needRemap = true;
            maxIdx = controlPoints.length - 2;
        } else {
            maxIdx = controlPoints.length - 1;
        }

        // Now remap the interior control points so they have the same spacing
        // as before the clamp.
        if (needRemap === true) {
            var span = controlPoints[maxIdx].x - controlPoints[minIdx].x;
            for (var i = minIdx + 1; i < maxIdx; i += 1) {
                controlPoints[i].x = (controlPoints[i].x * span) + controlPoints[minIdx].x;
            }
        }

        // Now actually generate the lookup table from the (maybe modified)
        // control points.
        for (var idx = 0; idx < nbColorInTable; idx += 1) {
            var value = idx / nbColorInTable,
                pointA = this.extractPoint(controlPoints, currentControlIdx),
                pointB = this.extractPoint(controlPoints, currentControlIdx + 1);

            if (value > pointB[0]) {
                currentControlIdx += 1;
                pointA = this.extractPoint(controlPoints, currentControlIdx);
                pointB = this.extractPoint(controlPoints, currentControlIdx + 1);
            }

            table.push(this.interpolateColor(pointA, pointB, value));
        }

        function lut(value) {
            return table[Math.floor(value * nbColorInTable)];
        }

        return lut;
    },

    _invalidateTable: function (name) {
        this.trigger('c:lut-invalid', {'field': name});
    }
});
