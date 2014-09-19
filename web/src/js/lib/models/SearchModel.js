/**
 * This model is used to store the state of a search query, and implements the
 * search filtering logic.
 */
cinema.models.SearchModel = Backbone.Model.extend({
    constructor: function (settings) {
        Backbone.Model.apply(this, arguments);

        this.layerModel = settings.layerModel;
        this.query = settings.query || null;
    },

    /**
     * This method computes all matching search results, and triggers
     * a 'c:done' event when it has finished.
     */
    compute: function () {
        this.results = [];

        // TODO implement search filtering. This generates some
        // fake results for the moment.
        this.results = [
            {time: '3', phi: '20.0', theta: '90'},
            {time: '4', phi: '0.0', theta: '115.0'}
        ];
        this.trigger('c:done');
    }
});
