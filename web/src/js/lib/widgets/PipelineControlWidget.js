/**
 * This widget provides visibility and color data controls for a VisualizationModel.
 * It emits an event anytime the value has chaged, attaching data in the form
 * of a serialized query string.
 */
cinema.views.PipelineControlWidget = Backbone.View.extend({
    events: {
        'click .c-layer-visibility-toggle': function (e) {
            var link = $(e.currentTarget);

            if (link.attr('state') === 'on') {
                link.attr('state', 'off').find('i')
                    .removeClass('icon-eye')
                    .addClass('icon-eye-off c-icon-disabled');
            }
            else {
                link.attr('state', 'on').find('i')
                    .removeClass('icon-eye-off c-icon-disabled')
                    .addClass('icon-eye');
            }

            this.computeQuery();
        },

        'change .c-layer-color-select': function (e) {
            this.computeQuery();
        }
    },

    initialize: function (settings) {
        this.visModel = settings.visModel;
        this.query = settings.query || this.visModel.defaultQuery();
    },

    render: function () {
        this.$el.html(cinema.templates.pipelineControl({
            metadata: this.visModel.get('metadata')
        }));

        this.computeQuery();

        return this;
    },

    /**
     * Compute the new query string based on the current state of the widget.
     * Triggers a c:query.update event with the new query.
     */
    computeQuery: function () {
        var q = '';
        _.each(this.$('.c-layer-visibility-toggle[state=on]'), function (el) {
            q += $(el).attr('layer-id');
            q += $(el).parents('.c-pipeline-layer-wrapper').find('.c-layer-color-select').val();
        });

        if (q !== this.query) {
            this.query = q;
            this.trigger('c:query.update', this.query);
        }
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
