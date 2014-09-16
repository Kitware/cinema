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

        'click .c-pipeline-visibility-toggle': function (e) {
            var link = $(e.currentTarget),
                state;

            if (link.attr('state') === 'on') {
                state = 'off';
                link.attr('state', state).find('i')
                    .removeClass('icon-eye')
                    .addClass('icon-eye-off c-icon-disabled');


            }
            else {
                state = 'on';
                link.attr('state', state).find('i')
                    .removeClass('icon-eye-off c-icon-disabled')
                    .addClass('icon-eye');
            }

            _.each(link.parent().find('.c-layer-visibility-toggle'), function (el) {
                $(el).attr('state', state);

                if (state === 'on') {
                    $(el).find('i').removeClass('icon-eye-off c-icon-disabled')
                                   .addClass('icon-eye');
                }
                else {
                    $(el).find('i').removeClass('icon-eye')
                                   .addClass('icon-eye-off c-icon-disabled');
                }
            });

            this.computeQuery();
        }
    },

    initialize: function (settings) {
        this.query = settings.query || this.model.defaultQuery();
        this.listenTo(this.model, 'change', this.render);
    },

    render: function () {
        var metadata = this.model.get('metadata');
        if (!metadata) {
            return;
        }
        this.$el.html(cinema.templates.pipelineControl({
            metadata: metadata
        }));

        var view = this;
        _.each(this.$('.c-layer-color-select'), function (el) {
            var layerId = $(el).attr('layer-id');
            $(el).popover('destroy').popover({
                html: true,
                placement: 'right',
                content: cinema.templates.colorByChooser({
                    layerId: layerId,
                    metadata: this.model.get('metadata')
                })
            }).off('show.bs.popover').on('show.bs.popover', function () {
                _.each(view.$('.c-layer-color-select'), function (otherEl) {
                    if ($(otherEl).attr('layer-id') !== layerId) {
                        $(otherEl).popover('hide');
                    }
                });
            }).on('shown.bs.popover', function () {
                $('input[name=color-by-select][value=' +
                    $(el).attr('color-field') + ']').attr('checked', 'checked');
                $('input[name=color-by-select]').change(function () {
                    $(el).attr('color-field', $(this).val());
                    view.computeQuery();
                });
                $('.c-popover-close').click(function () {
                    $(el).popover('hide');
                });
            });
        }, this);

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
            q += $(el).parent().find('.c-layer-color-select').attr('color-field') ||
                 $(el).attr('color-field');
        });
        if (q !== this.query) {
            this.query = q;
            this.queryObj = this.unserializeQuery(q);
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
