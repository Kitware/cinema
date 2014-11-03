/**
 * This model holds the histogram data for a particular layer combination.
 */
cinema.models.CompositeHistogramModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.layerModel = settings.layerModel;
        this.basePath = settings.basePath;
    },

    fetch: function () {
        var layerStr = this.layerModel.getLayerString();

        if (!layerStr) {
            return;
        }
        this.url = this.basePath + '/layers/' + layerStr + '/histogram.json';
        return Backbone.Model.prototype.fetch.apply(this, arguments);
    },

    loaded: function () {
        return this.has('images');
    },

    getData: function (name) {
        if(this.loaded()) {
            return this.get(name);
        }
        return 'no-match';
    }
});
