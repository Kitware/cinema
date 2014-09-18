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
     * This method slightly subverts the normal Backbone fetch behavior; here,
     * it is used to compute matching search results and stream them out. The
     * output stream should be consumed by listening on the 'c:result' event
     * of this object. The stream elements are viewpoint objects, i.e. objects
     * with time, phi, and theta keys.
     *
     * @param [limit] Maximum number of results to stream out from this fetch call.
     */
    fetch: function (limit) {
        limit = limit || 10;
        // TODO implement search filtering. This spits out some
        // fake results for the moment.
        this.trigger('c:result', {time: "3", phi: "20.0", theta: "90"});
        this.trigger('c:result', {time: "4", phi: "0.0", theta: "115.0"});
    }
});
