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
    },

    _refreshCamera: function () {
        this.renderView.showViewpoint();
    }
});

// Register Composite view to the factory
cinema.viewFactory.registerView('composite-image-stack', 'RenderView', function(that, visModel){
    var layers = new cinema.models.LayerModel(visModel.defaultLayers());
    var viewportView = new cinema.views.ViewportView({
        el: that.$('.c-rv-viewport-container'),
        model: visModel,
        layers: layers
    });

    var pipelineControlView = new cinema.views.PipelineControlWidget({
        el: that.$('.c-rv-pipeline-control-container'),
        model: visModel,
        layers: layers
    });

    cinema.events.on('c:app.show-pipeline-controls', function () {
        that.$('.c-rv-pipeline-panel').fadeIn();
    }, that).on('c:app.show-view-controls', function () {
        that.$('.c-rv-view-panel').fadeIn();
    }, that);

    var pipelineAnimationWidget = new cinema.views.PipelineAnimationWidget({
        el: that.$('.c-rv-view-control-container'),
        model: visModel,
        viewport: viewportView
    });

    that.listenTo(visModel, 'change', function () {
        viewportView.render();
        pipelineControlView.render();
        pipelineAnimationWidget.render();
    });
});