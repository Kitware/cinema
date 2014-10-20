/**
 * This model holds the histogram data for a particular layer combination.
 */
cinema.models.StaticHistogramModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.basePath = settings.basePath;
    },

    fetch: function (options) {
        this.url = this.basePath + '/layers/' + options.layerCodeString + '/histogram.json';
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
