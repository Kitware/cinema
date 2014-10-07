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
    },

    loaded: function () {
        return this.has('metadata');
    },

    url: function () {
        return this.urlRoot + '/' + this.infoFile;
    },

    workbench: function () {
        return false;
    },

    getDataType: function () {
        if (this.loaded()) {
            return this.workbench() ? '' : this.get('metadata').type;
        }
        return 'no-match';
    },

    getFilePattern: function (args, ignoreList) {
        var keySet = args || {},
            result = this.get('name_pattern') || '',
            kp = ['{','}'],
            ignore = ignoreList || [];

        _.each(keySet, function (value, key) {
            if (!_.contains(ignore, key)) {
                result = result.replace(kp.join(key), value);
            }
        });

        return result;
    },

    lengthPhi: function () {
        if (!_.has(this, '_lengthPhi')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'phi')) {
                this._lengthPhi = args.phi.values.length;
            } else {
                this._lengthPhi = 0;
            }
        }
        return this._lengthPhi;
    },

    lengthTheta: function () {
        if (!_.has(this, '_lengthTheta')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'theta')) {
                this._lengthTheta = args.theta.values.length;
            } else {
                this._lengthTheta = 0;
            }
        }
        return this._lengthTheta;
    },

    lengthTime: function () {
        if (!_.has(this, '_lengthTime')) {
            var args = this.get('arguments') || {};
            if (_.has(args, 'time')) {
                this._lengthTime = args.time.values.length;
            } else {
                this._lengthTime = 0;
            }
        }
        return this._lengthTime;
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
            self._maxOrdinal *= arr.length;
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

        for (var i = this._argArrays.length - 1; i >= 0; i -= 1) {
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
    },

    imageCount: function () {
        return this.lengthPhi() * this.lengthTime() * this.lengthTheta();
    }
});
