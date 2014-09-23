/**
 * This model is used to store the state of a search query, and implements the
 * search filtering logic.
 */
cinema.models.SearchModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.layerModel = settings.layerModel;
        this.visModel = settings.visModel;
        this.query = settings.query || null;
    },

    /**
     * This method computes all matching search results, and triggers
     * a 'c:done' event when it has finished.
     */
    compute: function () {
        this.results = [];

        var i;
        for (i = 0; i < this.visModel.imageCount(); i++) {
            var viewpoint = this.visModel.ordinalToObject(i);

            // TODO filter based on query.
            this.results.push(viewpoint);
        }
        // TODO sort results.

        this.trigger('c:done');
    }
});
