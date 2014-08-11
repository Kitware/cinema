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

    deltaPhi: function () {
        if (!_.has(this, '_deltaPhi')) {
            var args = this.get('arguments');
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
            var args = this.get('arguments');
            if (_.has(args, 'theta') && args.theta.values.length > 1) {
                this._deltaTheta = args.theta.values[1] - args.theta.values[0];
            }
            else {
                this._deltaTheta = 0;
            }
        }

        return this._deltaTheta;
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
    }
});
