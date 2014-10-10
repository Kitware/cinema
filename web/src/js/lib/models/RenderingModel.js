/**
 * Represents a cinema rendering options. Stores the required info in the model's
 * attributes.
 */
cinema.models.RenderingModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.url = settings.url;
        this.visModel = settings.visModel;
        this.fieldMap = {};
        this.lutMap = {};
    },

    defaults: {
    },

    initializeLookupTables: function() {
        var fields = this.visModel.attributes.metadata.fields;
        for (var fieldCode in fields) {
            if (_.has(fields, fieldCode)) {
                var fieldName = fields[fieldCode];
                this.initializeLutForFieldToPreset(fieldCode, 'spectral');
                this.fieldMap[fieldName] = fieldCode;
            }
        }
    },

    ensureLookupTablesReady: function() {
        if (_.isEmpty(this.lutMap)) {
            this.initializeLookupTables();
        }
    },

    initializeLutForFieldToPreset: function(fieldCode, presetName) {
        var controlPoints = this.getControlPoints(presetName);
        if (controlPoints !== 'no-match') {
            var controlPointsArray = $.extend(true, [], controlPoints);
            this.lutMap[fieldCode] = controlPointsArray;
        }
    },

    getLookupTableForField: function(fieldCode) {
        this.ensureLookupTablesReady();
        return this.getLutFunctionFromControlPoints(this.lutMap[fieldCode]);
    },

    getControlPointsForField: function(fieldCode) {
        return this.lutMap[fieldCode];
    },

    getFields: function() {
        this.ensureLookupTablesReady();
        return this.fieldMap;
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

    getLookupTableFunction: function (name) {
        var controlPoints = this.getControlPoints(name);
        return this.getLutFunctionFromControlPoints(controlPoints);
    },

    getLutFunctionFromControlPoints: function(controlPoints) {
        var table =  [],
            currentControlIdx = 0;

        for (var idx = 0; idx < 256; idx += 1) {
            var value = idx / 255.0,
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
            return table[Math.floor(value * 255)];
        }

        return lut;
    },

    _invalidateTable: function (name) {

    }
});
