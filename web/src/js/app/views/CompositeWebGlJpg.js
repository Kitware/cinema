cinema.views.CompositeWebGlJpgView = Backbone.View.extend({
    initialize: function () {
        this.compositeModel = new cinema.decorators.Composite(this.model);
        this.compositeManager = new cinema.utilities.CompositeImageManager({
            visModel: this.model,
            files: ['rgb.jpg', 'depth.jpg']
        });
        this.controlModel = new cinema.models.ControlModel({ info: this.model });
        this.viewpointModel = new cinema.models.ViewPointModel({ controlModel: this.controlModel });
        this.layers = new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup(),
            { info: this.model });
        this.compositor = new cinema.utilities.CreateWebGlJpgCompositor();

        this.listenTo(this.controlModel, 'change', this.refreshCamera);
        this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
        this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
    },

    render: function () {
        if (this.renderView) {
            this.renderView.remove();
        }

        this.renderView = new cinema.views.VisualizationWebGlJpgCanvasWidget({
            el: this.$('.c-body-container'),
            model: this.compositeModel,
            layers: this.layers,
            controls: this.controlModel,
            viewpoint: this.viewpointModel,
            compositeManager: this.compositeManager,
            webglCompositor: this.compositor
        });

        new cinema.utilities.RenderViewMouseInteractor({
            renderView: this.renderView,
            camera: this.viewpointModel
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        }).enableDragPan({
            keyModifiers: cinema.keyModifiers.SHIFT
        }).enableDragRotation({
            keyModifiers: null
        });

        this.renderView.render().showViewpoint();

        if (this.toolsWidget) {
            this.toolsWidget.remove();
        }

        this.toolsWidget = new cinema.views.CompositeToolsWidget({
            el: this.$('.c-tools-panel'),
            model: this.compositeModel,
            controlModel: this.controlModel,
            viewpoint: this.viewpointModel,
            layers: this.layers,
            toolbarSelector: '.c-panel-toolbar'
        });

        this.toolsWidget.render();

        return this;
    },

    refreshCamera: function () {
        if (this.renderView) {
            this.renderView.showViewpoint();
        }
    },

    resetCamera: function () {
        if (this.renderView) {
            this.renderView.showViewpoint();
            this.renderView.resetCamera();
        }
    },

    remove: function () {
        if (this.renderView) {
            this.renderView.remove();
        }
        Backbone.View.prototype.remove.apply(this, arguments);
    }
});

cinema.viewMapper.registerView('composite-image-stack-jpgdepth', 'view', cinema.views.CompositeWebGlJpgView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});
