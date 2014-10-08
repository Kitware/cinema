/**
 * This widget provides visibility and color data controls for a VisualizationModel.
 * It emits an event anytime the value has chaged, attaching data in the form
 * of a serialized query string.
 */
cinema.views.PipelineWidget = Backbone.View.extend({
    events: {
        'click .c-remove-layer-toggle': 'removeLayerToggle',
        'click .c-pipeline-visibility-toggle': 'togglePipelineVisibility'
    },

    initialize: function (settings) {
        var defaultLayers = this.model.getDefaultPipelineSetup();
        this.layers = settings.layers || new cinema.models.LayerModel(defaultLayers, { info: this.model });
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.layers, 'change', this._layerChangeHandler);
        this.render();
    },

    render: function () {
        var metadata,
            popovers,
            view = this;
        if (!this.model.loaded()) {
            return;
        }

        metadata = this.model.get('metadata');

        this.$el.html(cinema.templates.pipeline({
            metadata: metadata
        }));

        popovers = this.$('[data-toggle="popover"]')
            .popover('destroy')
            .off('show.bs.popover')
            .on('show.bs.popover', this._hidePopovers)
            .off('shown.bs.popover');

        popovers.filter('.c-pipeline-layers-select')
            .each(function () {
                var directoryId = $(this).parent().attr('directory-id');

                $(this).popover({
                    html: true,
                    placement: 'left',
                    template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content c-layer-add-remove"></div></div>',
                    container: view.el,
                    content: cinema.templates.directoryAddLayers({
                        directoryId: directoryId,
                        metadata: view.model.get('metadata')
                    })
                });
            })
            .on('shown.bs.popover', function () {
                var input = view.$('input'),
                    layers = view.layers;

                input.each(function () {
                    var $this = $(this);
                    $this.prop('checked', layers.status($this.attr('layer-id')) !== 'closed');
                });

                // Change the layer model on selection changes.
                input.change(function () {
                    var $this = $(this),
                        layerId = $this.attr('layer-id');

                    if ($this.prop('checked')) {
                        layers.open(layerId);
                    } else {
                        layers.close(layerId);
                    }
                });
            });

        popovers.filter('.c-directory-color-select,.c-layer-color-select')
            .each(function () {
                var $this = $(this),
                    directoryId = $this.parent().attr('directory-id'),
                    metadata = view.model.get('metadata'),
                    layerId = $this.parent().attr('layer-id') || metadata.pipeline[directoryId].ids[0];
                $(this).popover({
                    html: true,
                    container: view.el,
                    placement: 'right',
                    template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content c-color-by-popover"></div></div>',
                    content: cinema.templates.colorByChooser({
                        directoryId: directoryId,
                        layerId: layerId,
                        metadata: metadata
                    })
                });
            })
            .on('shown.bs.popover', function () {
                var input = view.$('input'),
                    layerId = input.attr('layer-id'),
                    directoryId = input.attr('directory-id'),
                    layers = view.layers;

                if (directoryId !== '-1') {
                    // convert directory id's as numeric layer id's
                    // for the layer model
                    layerId = Number(directoryId);
                }

                // Set the initial state of the color selection dialog.
                input.each(function () {
                    $(this).prop('checked', $(this).attr('value') === layers.color(layerId));
                });

                // Attach handlers.
                input.change(function () {
                    var color = $(this).attr('value');
                    layers.color(layerId, color);
                });
            });

        this._layerChangeHandler();

        return this;
    },

    /**
     * Remove layer from pipeline.
     *
     * @param e
     */
    removeLayerToggle: function (e) {
        var link = $(e.currentTarget);

        this._hidePopovers();
        this.layers.close(link.parent().attr('layer-id'));
    },

    /**
     * Update the view properties according to the layer model.
     * This will:
     *   1. Open or close layer widgets
     *   2. Update icons according to layer visibility
     */
    _layerChangeHandler: function () {
        var view = this,
            layers = this.layers;

        function updateIcon(icon, state) {
            if (state === 'rendered') {
                icon.removeClass('c-icon-disabled')
                    .addClass('c-icon-enabled');

                if (icon.hasClass('icon-eye-off')) {
                    icon.removeClass('icon-eye-off')
                        .addClass('icon-eye');
                }

            } else {
                icon.removeClass('c-icon-enabled')
                    .addClass('c-icon-disabled');

                if (icon.hasClass('icon-eye')) {
                    icon.removeClass('icon-eye')
                        .addClass('icon-eye-off');
                }
            }

        }

        this.$('i.c-pipeline-icon').each(function () {
            var $this = $(this),
                layerId = $this.parent().parent().attr('layer-id'),
                directoryId = $this.parent().parent().attr('directory-id'),
                state;

            if (directoryId !== '-1') {
                layerId = Number(directoryId);
            }

            state = view.layers.status(layerId);
            updateIcon($this, state);
        });

        this.$('.c-pipeline-layer-wrapper').each(function () {
            var $this = $(this),
                layerId = $this.attr('layer-id');
            if (layers.status(layerId) === 'closed') {
                // remove layer control
                $this.fadeOut();
            } else {
                // add layer control
                $this.fadeIn();
            }
        });
    },

    /**
     * Toggle current target's (pipeline) visibility.
     *
     * @param e
     */
    togglePipelineVisibility: function (e) {
        var link = $(e.currentTarget),
            layers = this.layers,
            layerId, directoryId;

        directoryId = link.parent().attr('directory-id');
        layerId = link.parent().attr('layer-id');
        if (!layerId) {
            layerId = Number(directoryId);
        }


        if (this.layers.status(layerId) === 'hidden') {
            layers.show(layerId);
        } else {
            layers.hide(layerId);
        }
    },

    /**
     * Hide all popovers except `this`.
     */
    _hidePopovers: function () {
        var popovers = $('[data-toggle="popover"]');
        popovers.not(this).popover('hide');
    }
});
