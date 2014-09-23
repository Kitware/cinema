/**
 * This widget provides visibility and color data controls for a VisualizationModel.
 * It emits an event anytime the value has chaged, attaching data in the form
 * of a serialized query string.
 */
cinema.views.PipelineControlWidget = Backbone.View.extend({
    events: {
        'click .c-remove-layer-toggle': 'removeLayerToggle',
        'click .c-pipeline-visibility-toggle': 'togglePipelineVisibility'
    },

    initialize: function (settings) {
        var defaultLayers = this.model.getDefaultPipelineSetup();
        this.layers = settings.layers || new cinema.models.LayerModel(defaultLayers);
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

        _.each(this.$('.c-pipeline-layers-select'), function (el) {
            var theEl = $(el),
                directoryId = theEl.attr('directory-id');
            theEl.popover('destroy').popover({
                html: true,
                container: 'body',
                placement: 'left',
                template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content c-color-by-popover"></div></div>',
                content: cinema.templates.directoryAddLayers({
                    directoryId: directoryId,
                    metadata: this.model.get('metadata')
                })
            }).off('show.bs.popover').on('show.bs.popover', function () {
                _.each(view.$('.c-pipeline-layers-select'), function (selectEl) {
                    if ($(selectEl).attr('directory-id') !== directoryId) {
                        $(selectEl).popover('hide');
                    }
                });
                view.$('.c-directory-color-select,.c-layer-color-select').popover('hide');
            }).on('shown.bs.popover', function () {
                $('input[name="directory-layer-select"][layer-id="' + theEl.attr('layer-id') + '"]').attr('checked', 'checked');
                $('input[name="directory-layer-select"]').change(function () {
                    var layer = $(this);
                    view.addOrRemoveLayer(layer);
                    view.computeQuery();
                });
                _.each(view.$('.c-remove-layer-toggle'), function (visibilityEl) {
                    view.toggleVisibiltyOfLayer(visibilityEl);
                });
            });
        }, this);

        _.each(this.$('.c-directory-color-select'), function (el) {
            var theEl = $(el),
                directoryId = theEl.attr('directory-id'),
                layerId = theEl.attr('layer-id');
            theEl.popover('destroy').popover({
                html: true,
                container: 'body',
                placement: 'right',
                template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content c-color-by-popover"></div></div>',
                content: cinema.templates.directoryColorByChooser({
                    directoryId: directoryId,
                    layerId: layerId,
                    metadata: this.model.get('metadata')
                })
            }).off('show.bs.popover').on('show.bs.popover', function () {
                _.each(view.$('.c-directory-color-select'), function (otherEl) {
                    if ($(otherEl).attr('directory-id') !== directoryId) {
                        $(otherEl).popover('hide');
                    }
                });
                view.$('.c-pipeline-layers-select,.c-layer-color-select').popover('hide');
            }).on('shown.bs.popover', function () {
                $('input[name=color-by-select][value=' + theEl.attr('color-field') + ']').attr('checked', 'checked');
                $('input[name=color-by-select]').change(function () {
                    var color = $(this).val();
                    theEl.attr('color-field', color);
                    _.each(view.$('.c-layer-color-select'), function (otherEl) {
                        if ($(otherEl).attr('directory-id') === directoryId) {
                            $(otherEl).attr('color-field', color);
                        }
                    });
                    view.computeQuery();
                });
            });
        }, this);

        _.each(this.$('.c-layer-color-select'), function (el) {
            var directoryId = $(el).attr('directory-id'),
                layerId = $(el).attr('layer-id');
            $(el).popover('destroy').popover({
                html: true,
                placement: 'right',
                template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content c-color-by-popover"></div></div>',
                content: cinema.templates.colorByChooser({
                    directoryId: directoryId,
                    layerId: layerId,
                    metadata: this.model.get('metadata')
                })
            }).off('show.bs.popover').on('show.bs.popover', function () {
                _.each(view.$('.c-layer-color-select'), function (otherEl) {
                    if ($(otherEl).attr('layer-id') !== layerId) {
                        $(otherEl).popover('hide');
                    }
                });
                view.$('.c-pipeline-layers-select,.c-directory-color-select').popover('hide');
            }).on('shown.bs.popover', function () {
                $('input[name=color-by-select][value=' + $(el).attr('color-field') + ']').attr('checked', 'checked');
                $('input[name=color-by-select]').change(function () {
                    $(el).attr('color-field', $(this).val());
                    view.computeQuery();
                });
            });
        }, this);

        this.computeQuery();

        return this;
    },

    /**
     * Compute the new query string based on the current state of the widget.
     */
    computeQuery: function () {
        var q = '';
        _.each(this.$('.c-remove-layer-toggle[state=on][visible=on]'), function (el) {
            q += $(el).attr('layer-id');
            q += $(el).parent().find('.c-layer-color-select').attr('color-field') ||
                $(el).attr('color-field');
        });

        this.layers.setFromString(q);
    },

    /**
     * Add or remove a layer from a directory of the widget.
     */
    addOrRemoveLayer: function (layer) {
        var layerVisibility = $("#LayerVisibility-" + layer.attr('directory-id') + "-" + layer.attr('layer-id')),
            layerWrapper = $("#LayerWrapper-" + layer.attr('directory-id') + "-" + layer.attr('layer-id'));

        if (layer.is(":checked")) {
            layerVisibility.attr('state', 'on');
            layerWrapper.fadeIn();
        }
        else {
            layerVisibility.attr('state', 'off');
            layerWrapper.fadeOut();
        }
    },

    /**
     * Toggle the visibility of a layer from a directory of the widget.
     */
    toggleVisibiltyOfLayer: function (el) {
        var El = $(el);
        if (El.attr('state') === 'on') {
            $('input[name="directory-layer-select"][layer-id="' + El.attr('layer-id') + '"]').prop("checked", true);
        }
        else {
            $('input[name="directory-layer-select"][layer-id="' + El.attr('layer-id') + '"]').prop("checked", false);
        }
    },

    /**
     * Remove layer from pipeline.
     *
     * @param e
     */
    removeLayerToggle: function (e) {
        var link = $(e.currentTarget);
        link.attr('state', 'off');
        link.parent().fadeOut();

        this.$('.c-pipeline-layers-select').popover('hide');
        this.computeQuery();
    },

    /**
     * Toggle current target's (pipeline) visibility.
     *
     * @param e
     */
    togglePipelineVisibility: function (e) {
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
        _.each(link.parent().find('.c-remove-layer-toggle'), function (el) {
            $(el).attr('visible', state);
            if (state === 'on') {
                $(el).find('i').removeClass('icon-cancel-circled c-pipeline-icon-disabled')
                    .addClass('icon-cancel-circled  c-pipeline-icon');
            }
            else {
                $(el).find('i').removeClass('icon-cancel-circled  c-pipeline-icon')
                    .addClass('icon-cancel-circled  c-pipeline-icon-disabled');
            }
        });
        this.computeQuery();
    }

});
