/**
 * This model holds the histogram data for a particular layer combination.
 */
cinema.models.HistogramModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.layerModel = settings.layerModel;
        this.basePath = settings.basePath;
    },

    fetch: function () {
        var layerStr = _.keys(this.layerModel.get('state')).sort().join('/');

        if (!layerStr) {
            return;
        }
        this.url = this.basePath + '/layers/' + layerStr + '/histogram.json';
        return Backbone.Model.prototype.fetch.apply(this, arguments);
    }
});
