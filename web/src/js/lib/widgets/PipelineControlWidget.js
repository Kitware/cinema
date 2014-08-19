/**
 * This widget provides visibility and color data controls for a VisualizationModel.
 * It emits an event anytime the value has chaged, attaching data in the form
 * of a serialized query string.
 */
cinema.views.PipelineControlWidget = Backbone.View.extend({
    events: {
    },

    initialize: function (settings) {
        this.visModel = settings.visModel;

        this.visModel.on('change', function () {
            this.query = settings.query || this.visModel.defaultQuery();
            this._layers = this.unserializeQuery(this.query);

            this.render();
        }, this);
    },

    render: function () {
        console.log(this.visModel.attributes);
        this.$el.html(cinema.templates.pipelineControl({
            layers: this._layers,
            metadata: this.visModel.get('metadata')
        }));

        return this;
    },

    /**
     * Convert an object that maps layer identifiers to color-by values into
     * a single string that is consumable by other parts of the application.
     */
    serializeQuery: function (obj) {
        var query = '';

        _.each(obj, function (v, k) {
            query += k + v;
        });

        return query;
    },

    /**
     * Convert a query string to an object that maps layer identifiers to
     * their color-by value. The query string is a sequence of two-character
     * pairs, where the first character identifies the layer ID and the second
     * character identifies which field it should be colored by.
     */
    unserializeQuery: function (query) {
        if (query.length % 2) {
            return console.error('Query string "' + query + '" has odd length.');
        }

        var obj = {};

        for (var i = 0; i < query.length; i += 2) {
            obj[query[i]] = query[i + 1];
        }

        return obj;
    }
});
