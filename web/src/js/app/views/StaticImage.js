cinema.views.StaticImageView = Backbone.View.extend({
    initialize: function (opts) {
        this.controlModel = new cinema.models.ControlModel({info: this.model});
        this.viewpointModel = new cinema.models.ViewPointModel({
            controlModel: this.controlModel
        });
        this._hasAnalysis = _.has(this.model.get('metadata'), 'analysis');

        if (this._hasAnalysis) {
            this.histogramModel = new cinema.models.CompositeHistogramModel({
                layerModel: this.layers,
                basePath: this.model.get('basePath'),
                analysisInfo: this.model.get('metadata').analysis
            });
            this.controlList = opts.defaultControls.slice(0); // copy
            this.controlList.push(
                { position: 'left', key: 'information', icon: 'icon-help', title: 'Information' },
                { position: 'center', key: 'histogram', icon: 'icon-chart-bar', title: 'Histogram' }
            );
        }

        this.listenTo(this.controlModel, 'change', this.refreshCamera);
        this.listenTo(this.viewpointModel, 'change', this.refreshCamera);
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

        if (this._hasAnalysis) {
            this.staticHistogram = new cinema.views.StaticHistogramWidget({
                el: this.$('.c-static-histogram-panel'),
                basePath: this.model.get('basePath'),
                histogramModel: this.histogramModel,
                viewpoint: this.viewpointModel,
                controlModel: this.controlModel,
                visModel: this.model,
                analysisInfo: this.model.get('metadata').analysis,
                toolbarSelector: '.c-panel-toolbar'
            });
            this.searchInformation = new cinema.views.ComposableInformationWidget({
                el: this.$('.c-information-panel'),
                model: this.model,
                controlModel: this.controlModel,
                exclude: ['layer', 'filename'],
                // layers: layerModel,
                analysisInfo: this.model.get('metadata').analysis,
                toolbarSelector: '.c-panel-toolbar'
            });
            this.staticHistogram.render();
            this.searchInformation.render();
        }

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
    },

    remove: function () {
        if (this.renderView) {
            this.renderView.remove();
        }
        Backbone.View.prototype.remove.apply(this, arguments);
    }
});

cinema.viewMapper.registerView('parametric-image-stack', 'view', cinema.views.StaticImageView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});
