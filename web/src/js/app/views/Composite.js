cinema.views.CompositeView = Backbone.View.extend({
    initialize: function (opts) {
        this.compositeModel = new cinema.decorators.Composite(this.model);
        this.compositeManager = new cinema.utilities.CompositeImageManager({ visModel: this.model });
        this.controlModel = new cinema.models.ControlModel({ info: this.model });
        this.viewpointModel = new cinema.models.ViewPointModel({ controlModel: this.controlModel });
        this.layers = new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup(),
            { info: this.model });
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

        this.controlModel.on('change', this.refreshCamera, this);
        this.viewpointModel.on('change', this.refreshCamera, this);
        this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);

        this.firstRender = true;
    },

    render: function () {
        if (this.renderView) {
            this.renderView.remove();
        }

        this.renderView = new cinema.views.VisualizationCanvasWidget({
            el: this.$('.c-body-container'),
            model: this.compositeModel,
            layers: this.layers,
            controls: this.controlModel,
            viewpoint: this.viewpointModel,
            compositeManager: this.compositeManager
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

        if (this._hasAnalysis) {
            if (this.histogramWidget) {
                this.histogramWidget.remove();
            }
            if (this.infoWidget) {
                this.infoWidget.remove();
            }
            this.histogramWidget = new cinema.views.CompositeHistogramWidget({
                el: this.$('.c-histogram-panel'),
                basePath: this.model.get('basePath'),
                histogramModel: this.histogramModel,
                viewpoint: this.viewpointModel,
                layers: this.layers,
                toolbarSelector: '.c-panel-toolbar'
            });

            this.infoWidget = new cinema.views.SearchInformationWidget({
                el: this.$('.c-information-panel'),
                model: this.compositeModel,
                controlModel: this.controlModel,
                exclude: ['layer', 'filename'],
                layers: this.layers,
                toolbarSelector: '.c-panel-toolbar'
            });

            this.histogramWidget.render();
            this.infoWidget.render();
        }

        if (this.firstRender) {
            this.firstRender = false;
            this.$('.c-histogram-panel').hide();
            this.$('.c-information-panel').hide();
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
            this.renderView.showViewpoint();
            this.renderView.resetCamera();
        }
    }
});

cinema.views.CompositeSearchView = Backbone.View.extend({
    initialize: function () {
        this.compositeModel = new cinema.decorators.Composite(this.model);
        this.controlModel = new cinema.models.ControlModel({ info: this.model });
        this.viewpointModel = new cinema.models.ViewPointModel({ controlModel: this.controlModel });
        this.layers = new cinema.models.LayerModel(this.compositeModel.getDefaultPipelineSetup(), {
            info: this.model
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

        this.controlModel.on('change', this.refreshCamera, this);
        this.viewpointModel.on('change', this.refreshCamera, this);
        this.listenTo(cinema.events, 'c:resetCamera', this.resetCamera);

        this.firstRender = true;
    },

    render: function () {
        if (this._hasAnalysis) {
            if (this.searchView) {
                this.searchView.remove();
            }

            this.searchView = new cinema.views.CompositeSearchPage({
                el: this.$('.c-body-container'),
                basePath: this.model.get('basePath'),
                histogramModel: this.histogramModel,
                visModel: this.compositeModel,
                layerModel: this.layers
            });

            this.searchView.render();

            if (this.compositeHistogram) {
                this.compositeHistogram.remove();
            }
            if (this.searchInformation) {
                this.searchInformation.remove();
            }

            this.searchInformation = new cinema.views.SearchInformationWidget({
                el: this.$('.c-information-panel'),
                model: this.compositeModel,
                controlModel: this.controlModel,
                exclude: ['layer', 'filename'],
                layers: this.layers,
                toolbarSelector: '.c-panel-toolbar'
            });

            this.compositeHistogram = new cinema.views.HistogramWidget({
                el: this.$('.c-histogram-panel'),
                basePath: this.model.get('basePath'),
                histogramModel: this.histogramModel,
                viewpoint: this.viewpointModel,
                layers: this.layers,
                toolbarSelector: '.c-panel-toolbar'
            });

            this.searchInformation.render();
            this.compositeHistogram.render();
        }

        if (this.searchTools) {
            this.searchTools.remove();
        }
        this.searchTools = new cinema.views.SearchToolsWidget({
            el: this.$('.c-tools-panel'),
            model: this.compositeModel,
            layers: this.layers,
            toolbarSelector: '.c-panel-toolbar'
        });
        this.searchTools.render();

        if (this.firstRender) {
            this.firstRender = false;
            this.$('.c-histogram-panel').hide();
            this.$('.c-information-panel').hide();
        }

        return this;
    }
});

cinema.viewMapper.registerView('composite-image-stack', 'view', cinema.views.CompositeView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
    ]
});

cinema.viewMapper.registerView('composite-image-stack', 'search', cinema.views.CompositeSearchView, {
    controls: [
        { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' },
    ]
});
