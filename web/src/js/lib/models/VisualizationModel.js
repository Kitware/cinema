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

    getDataType: function () {
        if(this.loaded()) {
            return this.get('metadata').type;
        }
        return 'no-match';
    },

    getFilePattern: function(args, ignoreList) {
        var keySet = args || {},
            result = this.get('name_pattern') || '',
            kp = ['{','}'],
            ignore = ignoreList || [];

        _.each(keySet, function(value, key) {
            if (!_.contains(ignore, key)) {
                result = result.replace(kp.join(key), value);
            }
        });

        return result;
    },

    getHash: function() {
      return this.url;
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
    }
});
