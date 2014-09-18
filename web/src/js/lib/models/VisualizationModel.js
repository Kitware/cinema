/**
 * Represents a cinema visualization. Stores the required info in the model's
 * attributes.
 */
cinema.models.VisualizationModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.basePath = settings.basePath;
        this.infoFile = settings.infoFile;
        this.url = this.basePath + '/' + this.infoFile;
    },

    defaults: {
        'arguments': {
            phi: {
                values: [],
                'default': 0
            },
            theta: {
                values: [],
                'default': 0
            },
            time: {
                values: [],
                'default': 0
            },
            layer: {
                values: []
            },
            field: {
                values: []
            }
        },
        metadata: {
            dimensions: [0, 0],
            fields: {},
            scalars: {},
            id: 'default-info-object',
            layer_fields: {},
            layers: '',
            offset: {},
            pipeline: [],
            title: 'Empty visualization',
            type: 'composite-image-stack'
        }
    },

    loaded: function () {
        return this.get('metadata').id !== 'default-info-object';
    },

    url: function () {
        return this.urlRoot + '/' + this.infoFile;
    },

    deltaPhi: function () {
        if (!_.has(this, '_deltaPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi') && args.phi.values.length > 1) {
                this._deltaPhi = args.phi.values[1] - args.phi.values[0];
            }
            else {
                this._deltaPhi = 0;
            }
        }

        return this._deltaPhi;
    },

    deltaTheta: function () {
        if (!_.has(this, '_deltaTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta') && args.theta.values.length > 1) {
                this._deltaTheta = args.theta.values[1] - args.theta.values[0];
            }
            else {
                this._deltaTheta = 0;
            }
        }

        return this._deltaTheta;
    },

    defaultPhi: function () {
        if (!_.has(this, '_defaultPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi') && _.has(args.phi, 'default')) {
                this._defaultPhi = args.phi['default'];
            }
            else {
                this._defaultPhi = 0;
            }
        }

        return this._defaultPhi;
    },

    defaultTheta: function () {
        if (!_.has(this, '_defaultTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta') && _.has(args.theta, 'default')) {
                this._defaultTheta = args.theta['default'];
            }
            else {
                this._defaultTheta = 0;
            }
        }

        return this._defaultTheta;
    },

    defaultTime: function () {
        if (!_.has(this, '_defaultTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time') && _.has(args.time, 'default')) {
                this._defaultTime = args.time['default'];
            }
            else {
                this._defaultTime = 0;
            }
        }

        return this._defaultTime;
    },

    deltaTime: function () {
        if (!_.has(this, '_deltaTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time') && args.time.values.length > 1) {
                this._deltaTime = args.time.values[1] - args.time.values[0];
            }
            else {
                this._deltaTime = 0;
            }
        }

        return this._deltaTime;
    },

    initialPhi: function () {
        if (!_.has(this, '_initialPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi')) {
                this._initialPhi = _.indexOf(args.phi.values, this.defaultPhi());
            }
            else {
                this._initialPhi = 0;
            }
        }

        return this._initialPhi;
    },

    initialTheta: function () {
        if (!_.has(this, '_initialTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta')) {
                this._initialTheta = _.indexOf(args.theta.values, this.defaultTheta());
            }
            else {
                this._initialTheta = 0;
            }
        }

        return this._initialTheta;
    },

    initialTime: function () {
        if (!_.has(this, '_initialTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time')) {
                this._initialTime = _.indexOf(args.time.values, this.defaultTime());
            }
            else {
                this._initialTime = 0;
            }
        }

        return this._initialTime;
    },

    lengthPhi: function () {
        if (!_.has(this, '_lengthPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi')) {
                this._lengthPhi = args.phi.values.length - 1;
            }
            else {
                this._lengthPhi = 0;
            }
        }

        return this._lengthPhi;
    },

    lengthTheta: function () {
        if (!_.has(this, '_lengthTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta')) {
                this._lengthTheta = args.theta.values.length - 1;
            }
            else {
                this._lengthTheta = 0;
            }
        }

        return this._lengthTheta;
    },

    lengthTime: function () {
        if (!_.has(this, '_lengthTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time')) {
                this._lengthTime = args.time.values.length - 1;
            }
            else {
                this._lengthTime = 0;
            }
        }

        return this._lengthTime;
    },

    maximumTime: function () {
        if (!_.has(this, '_maximumTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time') && args.time.values.length > 1) {
                this._maximumTime = args.time.values[args.time.values.length - 1];
            }
            else {
                this._maximumTime = 0;
            }
        }

        return this._maximumTime;
    },

    minimumPhi: function () {
        if (!_.has(this, '_minimumPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi') && args.phi.values.length >= 1) {
                this._minimumPhi = args.phi.values[0];
            }
            else {
                this._minimumPhi = 0;
            }
        }

        return this._minimumPhi;
    },

    maximumPhi: function () {
        if (!_.has(this, '_maximumPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi') && args.phi.values.length > 1) {
                this._maximumPhi = args.phi.values[args.phi.values.length - 1];
            }
            else {
                this._maximumPhi = 0;
            }
        }

        return this._maximumPhi;
    },

    minimumTheta: function () {
        if (!_.has(this, '_minimumTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta') && args.theta.values.length >= 1) {
                this._minimumTheta = args.theta.values[0];
            }
            else {
                this._minimumTheta = 0;
            }
        }

        return this._minimumTheta;
    },

    maximumTheta: function () {
        if (!_.has(this, '_maximumTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta') && args.theta.values.length > 1) {
                this._maximumTheta = args.theta.values[args.time.values.length - 1];
            }
            else {
                this._maximumTheta = 0;
            }
        }

        return this._maximumTheta;
    },

    minimumTime: function () {
        if (!_.has(this, '_minimumTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time') && args.time.values.length >= 1) {
                this._minimumTime = args.time.values[0];
            }
            else {
                this._minimumTime = 0;
            }
        }

        return this._minimumTime;
    },

    /**
     * Return the number of layers in this composited image.
     */
    numberOfLayers: function () {
        if (!_.has(this, '_numLayers')) {
            var layerFields = this.get('metadata').layer_fields || [];

            this._numLayers = _.reduce(layerFields, function (c, val) {
                return c + val.length;
            }, 1);
        }

        return this._numLayers;
    },

    /**
     * Return a [width, height] array representing the dimensions of the
     * composited (single) image to be rendered.
     */
    imageDimensions: function () {
        return this.get('metadata').dimensions;
    },

    /**
     * Return a [width, height] array representing the dimensions of the full
     * sprite sheet, which is assumed to be a vertically-stacked sprite sheet
     * of uniformly sized layers.
     */
    spritesheetDimensions: function () {
        var dim = this.imageDimensions();
        return [dim[0], dim[1] * this.numberOfLayers()];
    },

    _getNextCircular: function (list, val, amount) {
        var i = (_.indexOf(list, val) + amount) % list.length;

        if (i < 0) {
            i += list.length;
        }
        return list[i];
    },

    _getNextBounded: function (list, val, amount) {
        var i = Math.max(0, Math.min(_.indexOf(list, val) + amount, list.length - 1));
        return list[i];
    },

    getPhi: function (i) {
        return this.get('arguments').phi.values[i];
    },

    getTheta: function (i) {
        return this.get('arguments').theta.values[i];
    },

    getTime: function (i) {
        return this.get('arguments').time.values[i];
    },

    /**
     * Use this to get other discrete phi values.
     */
    incrementPhi: function (phi, amount) {
        return this._getNextCircular(this.get('arguments').phi.values, phi, amount);
    },

    /**
     * Use this to get other discrete theta values.
     */
    incrementTheta: function (theta, amount) {
        return this._getNextBounded(this.get('arguments').theta.values, theta, amount);
    },

    /**
     * Use this to get other discrete time values.
     */
    incrementTime: function (time, amount) {
        return this._getNextBounded(this.get('arguments').time.values, time, amount);
    },

    /**
     * Return the default query that this model should display. For now, this
     * returns the empty string, meaning no layers are rendered.
     */
    defaultLayers: function () {
        return '';
    },

    /**
     * Use the info.json "name_pattern" and "arguments" keys to build an
     * internal ordered list used in mapping ordinals to relative directory
     * paths.
     */
    initializeArgArrays: function () {
        var pattern = this.get('name_pattern') || "";
        var args = this.get('arguments') || {};
        var compList = pattern.split('/');
        var re = /{(.+)}/;
        this._argArrays = [];
        this._argKeys = [];
        this._maxOrdinal = 1;
        var self = this;
        _.each(compList.slice(0, compList.length - 1), function (value, idx, list) {
            var match = re.exec(value);
            self._argKeys.push(match[1]);
            var arr = args[match[1]].values;
            self._argArrays.push(arr);
            self._maxOrdinal *= arr.length
        });
        this._maxOrdinal -= 1;
    },

    /**
     * Convenience function to return the quotient and remainder from
     * integer division of the arguments
     */
    integerDivide: function (dividend, divisor) {
        return {
            'quo': Math.floor(dividend / divisor),
            'rem': dividend % divisor
        };
    },

    /**
     * Convert an image ordinal to an object containing the correct
     * values for each component in the info.json 'name_pattern', e.g.
     *
     *     {
     *         "time": "0",
     *         "theta": "10.0",
     *         "phi": "170.0"
     *     }
     *
     */
    ordinalToObject: function (ordinal) {
        if (!_.has(this, '_argArrays')) {
            this.initializeArgArrays();
        }

        if (ordinal > this._maxOrdinal) {
            throw "Ordinal " + ordinal + " out of range, max ordinal: " + this._maxOrdinal;
        }

        // Now proceed to integer divide the ordinal by rightmost length, save
        // remainder, then integer divide that quotient by the next
        // length to the left, save the remainder, etc... until you
        // get to the far left.
        var quotient = ordinal;
        var results = {};

        for (var i = this._argArrays.length - 1; i >= 0; i-=1) {
            var r = this.integerDivide(quotient, this._argArrays[i].length);
            results[this._argKeys[i]] = this._argArrays[i][r.rem];
            quotient = r.quo;
        }

        return results;
    },

    /**
     * Take an object of the form:
     *
     *    {
     *        "time": "0",
     *        "theta": "10.0",
     *        "phi": "170.0"
     *    }
     *
     * And use the internal order list _argKeys to create a relative path string
     * from it.
     *
     */
    objectToPath: function (obj) {
        if (!_.has(this, '_argArrays')) {
            this.initializeArgArrays();
        }

        var result = [];
        _.each(this._argKeys, function (value, idx, list) {
            result.push(obj[value]);
        });

        return result.join('/');
    }
});
