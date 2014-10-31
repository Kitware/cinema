cinema.views.StaticImageView = Backbone.View.extend({
    initialize: function () {
        this.controlModel = new cinema.models.ControlModel({info: this.model});
        this.viewpointModel = new cinema.models.ViewPointModel({
            controlModel: this.controlModel
        });

        this.controlModel.on('change', this.refreshCamera, this);
        this.viewpointModel.on('change', this.refreshCamera, this);
        this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);
    },

    render: function () {
        if (this.renderView) {
            this.renderView.remove();
        }

        this.renderView = new cinema.views.StaticImageVisualizationCanvasWidget({
            el: this.$('.c-body-container'),
            model: this.model,
            controlModel: this.controlModel,
            viewpoint: this.viewpointModel
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

        this.renderView.render();

        if (this.toolsWidget) {
            this.toolsWidget.remove();
        }
        this.toolsWidget = new cinema.views.ToolsWidget({
            el: this.$('.c-tools-panel'),
            model: this.model,
            controlModel: this.controlModel,
            viewport: this.renderView,
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
            this.renderView.resetCamera();
        }
    }
});

cinema.viewMapper.registerView('parametric-image-stack', 'view', cinema.views.StaticImageView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});
