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
        if (!this.has('_deltaPhi')) {
            var args = this.get('arguments');
            if (_.has(args, 'phi') && args.phi.values.length > 1) {
                this.set('_deltaPhi', args.phi.values[1] - args.phi.values[0]);
            }
            else {
                this.set('_deltaPhi', 0);
            }
        }

        return this.get('_deltaPhi');
    },

    deltaTheta: function () {
        if (!this.has('_deltaTheta')) {
            var args = this.get('arguments');
            if (_.has(args, 'theta') && args.theta.values.length > 1) {
                this.set('_deltaTheta', args.theta.values[1] - args.theta.values[0]);
            }
            else {
                this.set('_deltaTheta', 0);
            }
        }

        return this.get('_deltaTheta');
    },

    numberOfImages: function () {
        if (!this.has('_numImages')) {
            var layerFields = this.get('metadata').layer_fields;

            this.set('_numImages', _.reduce(layerFields, function (c, val) {
                return c + val.length;
            }, 0));
        }

        return this.get('_numImages');
    }
});
