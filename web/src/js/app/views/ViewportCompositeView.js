cinema.views.ViewportCompositeView = Backbone.View.extend({

    initialize: function (opts) {
        this.$el.html(cinema.app.templates.viewport());

        this.camera = opts.camera || new cinema.models.CameraModel({
            info: this.model
        });

        this.layers = opts.layers || new cinema.models.LayerModel(
            this.model.defaultLayers()
        );

        this.renderView = new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-viewport-renderer-container'),
            model: this.model,
            camera: this.camera,
            layers: this.layers
        }).render();

        this.mouseInteractor = new cinema.utilities.RenderViewMouseInteractor({
            renderView: this.renderView,
            camera: this.camera
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        }).enableDragPan({
            keyModifiers: cinema.keyModifiers.SHIFT
        }).enableDragRotation({
            keyModifiers: null
        });

        this.listenTo(this.camera, 'change', this._refreshCamera);
        this.listenTo(cinema.events, 'c:resetCamera', this.renderView.resetCamera);
    },

    _refreshCamera: function () {
        this.renderView.showViewpoint();
    }
});

// Register Composite view to the factory
cinema.viewFactory.registerView('composite-image-stack', 'RenderView', function (that, visModel) {
    var layers = new cinema.models.LayerModel(that.visModel.defaultLayers());
    var viewportView = new cinema.views.ViewportCompositeView({
        el: that.$('.c-rv-viewport-container'),
        model: that.visModel,
        layers: layers
    });

    var pipelineControlView = new cinema.views.PipelineControlWidget({
        el: that.$('.c-rv-pipeline-control-container'),
        model: that.visModel,
        layers: layers
    });

    var pipelineAnimationWidget = new cinema.views.PipelineAnimationWidget({
        el: that.$('.c-rv-view-control-container'),
        model: that.visModel,
        viewport: viewportView,
        toolbarContainer: that.$('.c-rv-view-panel .c-panel-toolbar')
    });

    var renderChildren = function () {
        viewportView.render();
        pipelineControlView.render();
        pipelineAnimationWidget.render();
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
