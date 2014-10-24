/**
 * This model holds the histogram data for a particular layer combination.
 */
cinema.models.StaticHistogramModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.analysisInfo = settings.analysisInfo;
        this.relativePath = this.analysisInfo.relativePath;
        this.fileName = this.analysisInfo.filename;
        this.basePath = settings.basePath + '/' + this.relativePath;
    },

    fetch: function (options) {
        this.url = this.basePath + '/' + options.layerCodeString + '/' + this.fileName;
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
