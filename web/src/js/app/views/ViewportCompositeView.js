cinema.views.ViewportCompositeView = Backbone.View.extend({

    initialize: function (opts) {
        this.$el.html(cinema.app.templates.viewport());

        this.fields = opts.fields || new cinema.models.FieldModel({
            info: this.model
        });

        this.viewpoint = opts.viewpoint ||  new cinema.models.ViewPointModel({
            fields: this.fields
        });

        this.layers = opts.layers || new cinema.models.LayerModel(
            this.model.defaultLayers()
        );

        this.renderView = new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-viewport-renderer-container'),
            model: this.model,
            fields: this.fields,
            viewpoint: this.viewpoint,
            layers: this.layers
        }).render();

        this.mouseInteractor = new cinema.utilities.RenderViewMouseInteractor({
            renderView: this.renderView,
            camera: this.viewpoint
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        }).enableDragPan({
            keyModifiers: cinema.keyModifiers.SHIFT
        }).enableDragRotation({
            keyModifiers: null
        });

        this.listenTo(this.fields, 'change', this._refreshCamera);
        this.listenTo(this.viewpoint, 'change', this._refreshCamera);
        this.listenTo(cinema.events, 'c:resetCamera', this.renderView.resetCamera);
    },

    _refreshCamera: function () {
        this.renderView.showViewpoint();
    }
});

// Register Composite view to the factory
cinema.viewFactory.registerView('composite-image-stack', 'RenderView', function (that, visModel) {
    var fieldsModel = new cinema.models.FieldModel({
        info: that.visModel
    });

    var viewpointModel = new cinema.models.ViewPointModel({
        fields: fieldsModel
    });

    var layers = new cinema.models.LayerModel(that.visModel.defaultLayers());

    var viewportView = new cinema.views.ViewportCompositeView({
        el: that.$('.c-rv-viewport-container'),
        model: that.visModel,
        layers: layers,
        fields: fieldsModel,
        viewpoint: viewpointModel
    });

    var pipelineControlView = new cinema.views.PipelineControlWidget({
        el: that.$('.c-rv-pipeline-control-container'),
        model: that.visModel,
        layers: layers
    });

    var fieldsControlWidget = new cinema.views.FieldsControlWidget({
        el: that.$('.c-rv-view-control-container'),
        model: that.visModel,
        viewport: viewportView,
        fields: fieldsModel,
        toolbarContainer: that.$('.c-rv-view-panel .c-panel-toolbar'),
        exclude: ['layer', 'field', 'filename']
    });

    var renderChildren = function () {
        viewportView.render();
        pipelineControlView.render();
        fieldsControlWidget.render();
    };

    if (that.visModel.loaded()) {
        renderChildren();
    }

    that.listenTo(visModel, 'change', function () {
        renderChildren();
    });
}, [
    { position: 'right', key: 'pipeline', icon: 'icon-layers', title: 'Pipeline' },
    { position: 'right', key: 'view',     icon: 'icon-camera', title: 'View' }
]);
