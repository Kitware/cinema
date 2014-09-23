/**
 * This widget provides visibility and color data controls for a VisualizationModel.
 * It emits an event anytime the value has chaged, attaching data in the form
 * of a serialized query string.
 */
cinema.views.CompositePipelineWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.fields = settings.fields || new cinema.models.FieldModel({ info: this.model });
        this.viewpoint = settings.viewpoint || new cinema.models.ViewPointModel({ fields: this.fields });
        this.layers = settings.layers || new cinema.models.LayerModel(this.model.defaultLayers());
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        console.log(this.$(this.toolbarSelector));

        this.$('.c-control-panel-body').html(cinema.templates.compositePipelineWidget());

        this.pipeline = new cinema.views.PipelineControlWidget({
            el: this.$('.c-pipeline-content'),
            model: this.model,
            layers: this.layers
        });

        this.controls = new cinema.views.FieldsControlWidget({
            el: this.$('.c-control-content'),
            model: this.model,
            viewport: this.viewpoint,
            fields: this.fields,
            toolbarContainer: this.$(this.toolbarSelector),
            exclude: ['layer', 'field', 'filename']
        });
        this.render();
    },

    render: function () {
        this.pipeline.render();
        this.controls.render();
    }
});