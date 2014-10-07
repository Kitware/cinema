/**
 * This widget provides visibility and color data controls for a VisualizationModel.
 * It emits an event anytime the value has changed, attaching data in the form
 * of a serialized query string.
 */
cinema.views.CompositeToolsWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.controlModel = settings.controlModel || new cinema.models.ControlModel({ info: this.model });
        this.viewpoint = settings.viewpoint || new cinema.models.ViewPointModel({ controlModel: this.controlModel });
        this.layers = settings.layers || new cinema.models.LayerModel(this.model.defaultLayers());
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        this.$('.c-control-panel-body').html(cinema.templates.compositeToolsWidget());

        this.listenTo(cinema.events, 'c:editpipelines', this.togglePipelineEditor);
        this.listenTo(cinema.events, 'c:editcontrols', this.toggleControlEditor);

        this.pipelineWidget = new cinema.views.PipelineWidget({
            el: this.$('.c-pipeline-content'),
            model: this.model,
            layers: this.layers
        });

        this.controlWidget = new cinema.views.ControlWidget({
            el: this.$('.c-control-content'),
            model: this.model,
            viewport: this.viewpoint,
            controlModel: this.controlModel,
            toolbarSelector: this.toolbarSelector,
            toolbarRootView: this,
            exclude: ['layer', 'field', 'filename']
        });
        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.compositeToolsWidget());
        this.pipelineWidget.setElement(this.$('.c-pipeline-content')).render();
        this.controlWidget.setElement(this.$('.c-control-content')).render();
    },

    hideControlEditor: function () {
        var link = this.$('.c-control-edit'),
            state;
        if (link.attr('state') === 'on') {
            state = 'off';
            link.attr('state', state);
            link.fadeOut();
        }
        else {
            state = 'on';
            link.attr('state', state);
            link.fadeIn();
        }
    },

    togglePipelineEditor: function () {
        this.$('.c-pipeline-edit').fadeToggle();

    },

    toggleControlEditor: function () {
        this.$('.c-control-edit').fadeToggle();
    }

});
